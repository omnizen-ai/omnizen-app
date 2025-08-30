import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  streamText,
  stepCountIs,
} from 'ai';
import { auth, type UserType } from '@/app/(auth)/auth';
import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import { convertToUIMessages, generateUUID } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { myProvider } from '@/lib/ai/providers';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { geolocation } from '@vercel/functions';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { after } from 'next/server';
import { ChatSDKError } from '@/lib/errors';
import type { ChatMessage } from '@/lib/types';
import type { ChatModel } from '@/lib/ai/models';
import type { VisibilityType } from '@/components/visibility-selector';
import {
  observe,
  updateActiveObservation,
  updateActiveTrace,
} from '@langfuse/tracing';
import { trace } from '@opentelemetry/api';
import { mcpClient } from '@/lib/mcp/client';

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        console.log(
          ' > Resumable streams are disabled due to missing REDIS_URL',
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

async function handleChatMessage(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  try {
    const {
      id,
      message,
      selectedChatModel,
      selectedVisibilityType,
    }: {
      id: string;
      message: ChatMessage;
      selectedChatModel: ChatModel['id'];
      selectedVisibilityType: VisibilityType;
    } = requestBody;

    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const userType: UserType = session.user.type;

    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      return new ChatSDKError('rate_limit:chat').toResponse();
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message,
      });

      await saveChat({
        id,
        userId: session.user.id,
        title,
        visibility: selectedVisibilityType,
      });
    } else {
      if (chat.userId !== session.user.id) {
        return new ChatSDKError('forbidden:chat').toResponse();
      }
    }

    const messagesFromDb = await getMessagesByChatId({ id });
    const uiMessages = [...convertToUIMessages(messagesFromDb), message];

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: message.id,
          role: 'user',
          parts: message.parts,
          attachments: [],
          createdAt: new Date(),
        },
      ],
    });

    // Update Langfuse trace with user input
    const userMessageText = message.parts
      .filter((part: any) => part.type === 'text')
      .map((part: any) => part.text)
      .join(' ');

    updateActiveTrace({
      input: userMessageText,
      userId: session.user.id,
      sessionId: id,
      tags: [selectedChatModel, 'chat'],
    });

    updateActiveObservation({
      input: userMessageText,
    });

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    // Get MCP tools dynamically
    let mcpTools = {};
    let mcpToolNames: string[] = [];
    try {
      mcpTools = await mcpClient.getTools();
      mcpToolNames = Object.keys(mcpTools);
      console.log(`[MCP] Loaded ${mcpToolNames.length} tools:`, mcpToolNames);
    } catch (error) {
      console.error('[MCP] Failed to load tools:', error);
      // Continue without MCP tools if they fail to load
    }

    const stream = createUIMessageStream({
      execute: ({ writer: dataStream }) => {
        // Combine static tools with MCP tools - moved inside execute where dataStream is available
        const allTools = {
          getWeather,
          createDocument: createDocument({ session, dataStream }),
          updateDocument: updateDocument({ session, dataStream }),
          requestSuggestions: requestSuggestions({
            session,
            dataStream,
          }),
          ...mcpTools, // Add MCP tools
        };

        // Combine tool names
        const allToolNames = [
          'getWeather',
          'createDocument',
          'updateDocument',
          'requestSuggestions',
          ...mcpToolNames, // Add MCP tool names
        ];

        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt({ selectedChatModel, requestHints }),
          messages: convertToModelMessages(uiMessages),
          // Enable multi-step tool calling (up to 5 steps)
          stopWhen: stepCountIs(25),
          experimental_transform: smoothStream({ chunking: 'word' }),
          tools: allTools,
          // Use activeTools instead of experimental_activeTools
          // Enable tools for all models (both support tool calling)
          activeTools: allToolNames as any,
          // Allow the model to choose whether to use tools
          toolChoice: 'auto',
          experimental_telemetry: {
            isEnabled: true,
            functionId: 'stream-text',
            metadata: {
              userId: session.user.id,
              chatId: id,
              model: selectedChatModel,
            },
          },
          // Track each step separately in Langfuse
          onStepFinish: async (stepResult) => {
            // Create a new observation for each step
            const stepObservation = {
              name: `step-${stepResult.toolCalls?.length ? 'tool-call' : 'text-generation'}`,
              input: stepResult.text || JSON.stringify(stepResult.toolCalls),
              output: stepResult.toolResults
                ? JSON.stringify(stepResult.toolResults)
                : stepResult.text,
              metadata: {
                stepNumber: stepResult.warnings?.length || 0,
                finishReason: stepResult.finishReason,
                hasToolCalls: !!stepResult.toolCalls?.length,
                hasToolResults: !!stepResult.toolResults?.length,
                usage: stepResult.usage,
              },
            };

            // Update active observation with step data
            updateActiveObservation(stepObservation);

            // Log tool calls and results for debugging
            if (stepResult.toolCalls?.length) {
              console.log(
                `[Step] Tool calls:`,
                stepResult.toolCalls.map((tc) => ({
                  name: tc.toolName,
                  id: tc.toolCallId,
                })),
              );
            }
            if (stepResult.toolResults?.length) {
              console.log(
                `[Step] Tool results received:`,
                stepResult.toolResults.length,
              );
            }
          },
          onFinish: async (result) => {
            // Final aggregated tracking
            const finalOutput = {
              text: result.text,
              totalSteps: result.steps?.length || 1,
              toolCallCount:
                result.steps?.reduce(
                  (acc, step) => acc + (step.toolCalls?.length || 0),
                  0,
                ) || 0,
              totalUsage: result.totalUsage,
            };

            // Update Langfuse traces with aggregated response
            updateActiveObservation({
              output: JSON.stringify(finalOutput),
              metadata: {
                finishReason: result.finishReason,
                stepCount: result.steps?.length || 1,
              },
            });

            updateActiveTrace({
              output: result.text || 'No text generated',
              tags: [
                selectedChatModel,
                `steps:${result.steps?.length || 1}`,
                result.toolCalls?.length ? 'with-tools' : 'text-only',
              ],
              metadata: {
                totalUsage: result.totalUsage,
                finishReason: result.finishReason,
              },
            });

            // End the active span
            const activeSpan = trace.getActiveSpan();
            if (activeSpan) {
              activeSpan.end();
            }
          },
        });

        result.consumeStream();

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          }),
        );
      },
      generateId: generateUUID,
      onFinish: async ({ messages }) => {
        await saveMessages({
          messages: messages.map((message) => ({
            id: message.id,
            role: message.role,
            parts: message.parts,
            createdAt: new Date(),
            attachments: [],
            chatId: id,
          })),
        });
      },
      onError: () => {
        return 'Oops, an error occurred!';
      },
    });

    const streamContext = getStreamContext();

    if (streamContext) {
      return new Response(
        await streamContext.resumableStream(streamId, () =>
          stream.pipeThrough(new JsonToSseTransformStream()),
        ),
      );
    } else {
      return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
    }
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    // Log the actual error for debugging
    console.error('[API/chat] Unexpected error:', error);
    console.error(
      '[API/chat] Error stack:',
      error instanceof Error ? error.stack : 'No stack trace',
    );
    // Return a generic error response for unexpected errors
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Wrap the handler with observe for Langfuse tracing
export const POST = observe(handleChatMessage, {
  name: 'handle-chat-message',
  endOnExit: false,
});

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  const chat = await getChatById({ id });

  if (chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
