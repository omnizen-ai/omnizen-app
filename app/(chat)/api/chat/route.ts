import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  streamText,
  stepCountIs,
  wrapLanguageModel,
  extractReasoningMiddleware,
} from 'ai';
import { auth, type UserType } from '@/app/(auth)/auth';
import { getDeepSeekDetailedPrompt, testPromptSize } from '@/lib/ai/prompts-deepseek-detailed';
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
import { createDatabaseTools } from '@/lib/tools/database-tools';
import { storeSuccessfulQuery, getRelevantExamples, formatExamplesForPrompt } from '@/lib/ai/query-memory';

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

    // Get database tools with user context
    const userContext = {
      userId: session.user.id,
      orgId: session.user.organizationId || '11111111-1111-1111-1111-111111111111', // Use test org ID
      workspaceId: session.user.workspaceId,
      role: session.user.role || 'user',
    };
    
    const databaseTools = createDatabaseTools(userContext);
    const dbToolNames = Object.keys(databaseTools);
    console.log(`[Database Tools] User context:`, userContext);
    console.log(`[Database Tools] Loaded ${dbToolNames.length} tools:`, dbToolNames);
    console.log(`[Database Tools] Tools object:`, Object.keys(databaseTools));
    
    // Check if we have database/business tools
    const hasBusinessTools = dbToolNames.length > 0;

    // Detect if this is a business-related query
    const messageText = message.parts
      .filter((part: any) => part.type === 'text')
      .map((part: any) => part.text)
      .join(' ')
      .toLowerCase();
    
    const businessKeywords = ['customer', 'invoice', 'revenue', 'expense', 'payment', 'product', 'inventory', 'account', 'business', 'sales', 'purchase', 'vendor', 'profit', 'cash', 'financial'];
    const isBusinessQuery = businessKeywords.some(keyword => messageText.includes(keyword)) || hasBusinessTools;
    
    // Simplified: Use primary prompt for all models
    const queryType = messageText.match(/^(hi|hello|hey)/) ? 'greeting' :
                     messageText.includes('report') ? 'report' :
                     messageText.match(/create|add|new/) ? 'write' :
                     isBusinessQuery ? 'business' : 'simple';
    
    // Use primary prompt with complete, accurate schema
    let optimizedSystemPrompt = getDeepSeekDetailedPrompt(queryType, messageText);
    
    // Inject workflow prompts if slash commands are present
    const { parseWorkflowCommands, getWorkflowPrompt, initializeWorkflowPrompts } = await import('@/lib/ai/workflow-prompts');
    
    // Initialize workflow prompts if needed (first time setup)
    await initializeWorkflowPrompts();
    
    const workflowCommands = parseWorkflowCommands(messageText);
    if (workflowCommands.length > 0) {
      for (const workflowType of workflowCommands) {
        const workflowPrompt = await getWorkflowPrompt(workflowType);
        if (workflowPrompt) {
          optimizedSystemPrompt += `\n\n## ${workflowType.toUpperCase()} WORKFLOW CONTEXT:\n${workflowPrompt}`;
          console.log(`[WorkflowPrompts] Injected ${workflowType} workflow into prompt`);
        }
      }
    }
    
    // Inject relevant query examples from memory (enhanced with workflow + entity context)
    const examples = await getRelevantExamples(messageText, 2);
    if (examples.length > 0) {
      const examplesPrompt = formatExamplesForPrompt(examples);
      optimizedSystemPrompt += examplesPrompt;
      console.log(`[QueryMemory] Injected ${examples.length} examples into prompt`);
    }
    
    console.log(`[Unified Prompt] Model: ${selectedChatModel}, Type: ${queryType}`);
    
    // Check if using DeepSeek model for reasoning middleware
    const isDeepSeekModel = selectedChatModel.includes('deepseek');

    const stream = createUIMessageStream({
      execute: ({ writer: dataStream }) => {
        // Log which model is being used
        console.log(`[Model Selection] Using model: ${selectedChatModel}`);
        
        // Only include necessary tools
        const allTools = {
          // Temporarily disable document tools to focus on text formatting
          // createDocument: createDocument({ session, dataStream }),
          // updateDocument: updateDocument({ session, dataStream }),
          ...databaseTools, // Add database tools
        };

        // Combine tool names - removed weather and suggestions
        const allToolNames = [
          // 'createDocument',
          // 'updateDocument',
          ...dbToolNames, // Add database tool names
        ];
        
        console.log(`[Tools Registration] Available tools:`, Object.keys(allTools));
        console.log(`[Tools Registration] Tool names for activeTools:`, allToolNames);

        // Wrap DeepSeek models with extractReasoningMiddleware to handle <process> blocks
        const model = isDeepSeekModel
          ? wrapLanguageModel({
              model: myProvider.languageModel(selectedChatModel),
              middleware: extractReasoningMiddleware({ 
                tagName: 'process',
                separator: '\n',
                startWithReasoning: false // DeepSeek includes the opening tag
              }),
            })
          : myProvider.languageModel(selectedChatModel);

        const result = streamText({
          model,
          system: optimizedSystemPrompt, // Use optimized prompt for token savings
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
            // Log DeepSeek intermediate steps for debugging
            if (isDeepSeekModel && stepResult.text && !stepResult.toolCalls?.length) {
              console.log(`[DeepSeek] Intermediate step text: "${stepResult.text.substring(0, 100)}..."`);
            }
            
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
              
              // Capture successful database queries for learning
              for (let i = 0; i < stepResult.toolCalls.length; i++) {
                const toolCall = stepResult.toolCalls[i];
                const toolResult = stepResult.toolResults?.[i];
                
                if (toolCall.toolName === 'dbRead' && toolResult) {
                  try {
                    // Access input and output properties correctly
                    const input = (toolCall as any).input;
                    const output = (toolResult as any).output;
                    
                    // Parse the input to get the query
                    let query: string | undefined;
                    if (typeof input === 'string') {
                      try {
                        const parsed = JSON.parse(input);
                        query = parsed.query;
                      } catch {
                        // Input might be the query directly
                        query = input;
                      }
                    } else if (input && typeof input === 'object') {
                      query = input.query;
                    }
                    
                    // Convert output to string for checking
                    const outputStr = typeof output === 'string' ? output : JSON.stringify(output);
                    
                    // Check if the query was successful (no error in output)
                    const isSuccess = outputStr && !outputStr.includes('[Error') && !outputStr.includes('Error:');
                    
                    // Store if query was successful
                    if (isSuccess && query) {
                      // Use enhanced storage with workflow + entity context
                      const { storeSuccessfulQueryWithContext } = await import('@/lib/ai/workflow-prompts');
                      await storeSuccessfulQueryWithContext(
                        messageText,  // Natural language query
                        query,        // SQL query
                        true
                      );
                      console.log('[QueryMemory] Stored successful query with enhanced context');
                    } else if (!isSuccess && query) {
                      console.log('[QueryMemory] Query failed, not storing');
                    } else {
                      console.log('[QueryMemory] Cannot store - missing query');
                    }
                  } catch (err) {
                    // Silent failure - non-critical
                    console.log('[QueryMemory] Failed to capture query:', err);
                  }
                }
              }
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
