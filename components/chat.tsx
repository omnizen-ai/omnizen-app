'use client';

import { DefaultChatTransport } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ChatHeader } from '@/components/chat-header';
import { fetchWithErrorHandlers, generateUUID } from '@/lib/utils';
import { useVotes } from '@/lib/api/hooks/use-votes';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { toast } from './toast';
import type { Session } from 'next-auth';
import { useSearchParams } from 'next/navigation';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { useAutoResume } from '@/hooks/use-auto-resume';
import { ChatSDKError } from '@/lib/errors';
import type { Attachment, ChatMessage, CustomUIDataTypes } from '@/lib/types';
import type { DataUIPart } from 'ai';
import { useDataStream } from './data-stream-provider';

const quickActionSuggestions = [
  "What were my top selling products last month?",
  "Which customers generated the most revenue this quarter?",
  "How is my revenue trending compared to last year?",
  "What is my current cash position and runway?",
  "Which invoices are overdue for payment?",
  "What is my gross profit margin this month?",
  "What are my operational bottlenecks right now?",
  "Which suppliers have the best lead times?",
  "How can I reduce my operational costs?",
  "What is my customer retention rate?",
  "Which marketing channels drive the most conversions?",
  "What is my average customer lifetime value?",
  "Show me hourly sales patterns for optimization",
  "How can I improve my inventory turnover?",
  "What are the risks in my supply chain?",
  "Create a marketing campaign strategy",
  "How much funding do I need for expansion?",
  "Develop a customer acquisition strategy",
];

// Streaming greeting component
function StreamingGreeting({ 
  session,
  setInput
}: { 
  session: Session | null;
  setInput?: (value: string) => void;
}) {
  const [displayedText, setDisplayedText] = useState('');
  
  // Generate random suggestion once when component mounts
  const [suggestion] = useState(() => {
    const randomIndex = Math.floor(Math.random() * quickActionSuggestions.length);
    return quickActionSuggestions[randomIndex];
  });
  
  const fullText = `Hey partner!\nTry asking: "${suggestion}"`;

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 30); // Typing speed in milliseconds

    return () => clearInterval(interval);
  }, [fullText]);

  // Split the text into lines
  const lines = displayedText.split('\n');
  const firstLine = lines[0] || '';
  const secondLine = lines[1] || '';
  
  const handleSuggestionClick = () => {
    if (setInput && suggestion) {
      setInput(suggestion);
      // Focus the input textarea after a short delay
      setTimeout(() => {
        const textarea = document.querySelector('textarea[placeholder*="Message"]') as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
          const length = textarea.value.length;
          textarea.setSelectionRange(length, length);
        }
      }, 100);
    }
  };
  
  return (
    <div className="text-2xl text-zinc-600">
      <p className="font-medium text-yellow-700/60 dark:text-amber-200/80">
        {firstLine}
      </p>
      {secondLine && (
        <p 
          className="mt-2 cursor-pointer hover:text-zinc-800 dark:hover:text-zinc-400 transition-colors"
          onClick={handleSuggestionClick}
        >
          {secondLine}
        </p>
      )}
    </div>
  );
}

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  session,
  autoResume,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  autoResume: boolean;
}) {
  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  const queryClient = useQueryClient();
  const { setDataStream } = useDataStream();

  const [input, setInput] = useState<string>('');

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
  } = useChat<ChatMessage>({
    id,
    messages: initialMessages,
    experimental_throttle: 100,
    generateId: generateUUID,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest({ messages, id, body }) {
        return {
          body: {
            id,
            message: messages.at(-1),
            selectedChatModel: initialChatModel,
            selectedVisibilityType: visibilityType,
            ...body,
          },
        };
      },
    }),
    onData: (dataPart) => {
      setDataStream((ds) => (ds ? [...ds, dataPart as DataUIPart<CustomUIDataTypes>] : []));
    },
    onFinish: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-history'] });
    },
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        toast({
          type: 'error',
          description: error.message,
        });
      }
    },
  });

  const searchParams = useSearchParams();
  const query = searchParams.get('query');

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      sendMessage({
        role: 'user' as const,
        parts: [{ type: 'text', text: query }],
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, '', `/chat/${id}`);
    }
  }, [query, sendMessage, hasAppendedQuery, id]);

  const { data: votes } = useVotes(id, messages.length >= 2);

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  useAutoResume({
    autoResume,
    initialMessages,
    resumeStream,
    setMessages,
  });

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={id}
          selectedModelId={initialChatModel}
          selectedVisibilityType={initialVisibilityType}
          isReadonly={isReadonly}
          session={session}
        />

        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-2xl px-4">
              <div className="flex justify-center w-full mb-8">
                <div className="w-[90%]">
                  <StreamingGreeting 
                    session={session} 
                    setInput={setInput}
                  />
                </div>
              </div>
              {!isReadonly && (
                <MultimodalInput
                  chatId={id}
                  input={input}
                  setInput={setInput}
                  status={status}
                  stop={stop}
                  attachments={attachments}
                  setAttachments={setAttachments}
                  messages={messages}
                  setMessages={setMessages}
                  sendMessage={sendMessage}
                  selectedVisibilityType={visibilityType}
                  session={session}
                />
              )}
            </div>
          </div>
        ) : (
          <>
            <Messages
              chatId={id}
              status={status}
              votes={votes}
              messages={messages}
              setMessages={setMessages}
              regenerate={regenerate}
              isReadonly={isReadonly}
              isArtifactVisible={isArtifactVisible}
            />

            <div className="sticky bottom-0 flex gap-2 px-4 pb-4 mx-auto w-full bg-background md:pb-6 md:max-w-3xl z-[1] border-t-0">
              {!isReadonly && (
                <MultimodalInput
                  chatId={id}
                  input={input}
                  setInput={setInput}
                  status={status}
                  stop={stop}
                  attachments={attachments}
                  setAttachments={setAttachments}
                  messages={messages}
                  setMessages={setMessages}
                  sendMessage={sendMessage}
                  selectedVisibilityType={visibilityType}
                  session={session}
                />
              )}
            </div>
          </>
        )}
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        sendMessage={sendMessage}
        messages={messages}
        setMessages={setMessages}
        regenerate={regenerate}
        votes={votes}
        isReadonly={isReadonly}
        selectedVisibilityType={visibilityType}
      />
    </>
  );
}
