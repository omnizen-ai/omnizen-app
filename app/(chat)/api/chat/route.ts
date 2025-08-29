import {
  convertToModelMessages,
  streamText,
} from 'ai';
import { auth } from '@/app/(auth)/auth';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  getChatById,
  getMessagesByChatId,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import { convertToUIMessages, generateUUID } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { myProvider } from '@/lib/ai/providers';
import { postRequestBodySchema } from './schema';
import { ChatSDKError } from '@/lib/errors';
import { mcpClient } from '@/lib/mcp/client';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const requestBody = postRequestBodySchema.parse(json);
    
    const {
      id,
      message,
      selectedChatModel,
      selectedVisibilityType,
    } = requestBody;

    const session = await auth();
    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    // Save or verify chat
    const chat = await getChatById({ id });
    if (!chat) {
      const title = await generateTitleFromUserMessage({ message });
      await saveChat({
        id,
        userId: session.user.id,
        title,
        visibility: selectedVisibilityType,
      });
    } else if (chat.userId !== session.user.id) {
      return new ChatSDKError('forbidden:chat').toResponse();
    }

    // Get messages and save user message
    const messagesFromDb = await getMessagesByChatId({ id });
    const uiMessages = [...convertToUIMessages(messagesFromDb), message];
    
    await saveMessages({
      messages: [{
        chatId: id,
        id: message.id,
        role: 'user',
        parts: message.parts,
        attachments: [],
        createdAt: new Date(),
      }],
    });

    // Get MCP tools for database access
    let mcpTools = {};
    try {
      mcpTools = await mcpClient.getTools();
      console.log('MCP tools loaded:', Object.keys(mcpTools));
    } catch (error) {
      console.error('Failed to get MCP tools:', error);
    }

    // Stream the response
    const result = streamText({
      model: myProvider.languageModel(selectedChatModel),
      system: systemPrompt({ selectedChatModel, requestHints: {} }),
      messages: convertToModelMessages(uiMessages),
      maxSteps: 20, // Allow many tool steps as requested
      tools: mcpTools,
      onStepFinish: ({ stepType, toolCalls, toolResults, text, finishReason }) => {
        console.log('Step finished:', {
          stepType,
          toolCallCount: toolCalls?.length || 0,
          toolResultCount: toolResults?.length || 0,
          hasText: !!text,
          finishReason
        });
        
        // Log tool details
        if (toolCalls?.length) {
          toolCalls.forEach(call => {
            console.log(`Tool called: ${call.toolName}, args:`, call.args);
          });
        }
        
        if (toolResults?.length) {
          toolResults.forEach(result => {
            console.log(`Tool result:`, result);
          });
        }
      },
      onFinish: async ({ text }) => {
        // Save assistant message after completion
        if (text) {
          try {
            await saveMessages({
              messages: [{
                id: generateUUID(),
                role: 'assistant',
                parts: [{ type: 'text', text }],
                createdAt: new Date(),
                attachments: [],
                chatId: id,
              }],
            });
          } catch (error) {
            console.error('Failed to save assistant message:', error);
          }
        }
      },
    });

    return result.toTextStreamResponse();
    
  } catch (error) {
    console.error('Chat API error:', error);
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new Response('Internal server error', { status: 500 });
  }
}

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

  const { deleteChatById } = await import('@/lib/db/queries');
  const chat = await getChatById({ id });
  
  if (chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const deletedChat = await deleteChatById({ id });
  return Response.json(deletedChat, { status: 200 });
}