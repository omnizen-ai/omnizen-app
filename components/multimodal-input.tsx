'use client';

import type { UIMessage } from 'ai';
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  memo,
} from 'react';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';

import { ArrowUpIcon } from './icons';
import { Share2Icon, FileTextIcon } from '@radix-ui/react-icons';
import { SquareIcon, ArrowDown } from 'lucide-react';
import { Button } from './ui/button';
import { QuickActions } from './quick-actions';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputSubmit,
} from './elements/prompt-input';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useScrollToBottom } from '@/hooks/use-scroll-to-bottom';
import type { VisibilityType } from './visibility-selector';
import type { Attachment, ChatMessage } from '@/lib/types';
import type { Session } from 'next-auth';

// Import focused components
import { AttachmentManager, useAttachmentManager } from './input/attachment-manager';
import { FileUploadHandler } from './input/file-upload-handler';
import { VoiceRecorder } from './input/voice-recorder';
import { useDocumentProcessor } from './input/document-processor';
import { CommandMenu } from './command-menu';
import { useCommandMenu } from '@/lib/hooks/use-command-menu';

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  sendMessage,
  className,
  selectedVisibilityType,
  session,
}: {
  chatId: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status: UseChatHelpers<ChatMessage>['status'];
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
  className?: string;
  selectedVisibilityType: VisibilityType;
  session?: Session | null;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();
  
  // Command menu for slash commands and @ mentions
  const { menuState, closeMenu, handleTextChange, insertCommand } = useCommandMenu(textareaRef);

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = '98px';
    }
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    '',
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    setInput(newValue);
    
    // Handle command menu detection
    const cursorPosition = event.target.selectionStart;
    handleTextChange(newValue, cursorPosition);
  };



  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);

  const submitForm = useCallback(() => {
    window.history.replaceState({}, '', `/chat/${chatId}`);

    sendMessage({
      role: 'user',
      parts: [
        ...attachments.map((attachment) => ({
          type: 'file' as const,
          url: attachment.url,
          name: attachment.name,
          mediaType: attachment.contentType,
        })),
        {
          type: 'text',
          text: input,
        },
      ],
    });

    setAttachments([]);
    setLocalStorageInput('');
    resetHeight();
    setInput('');

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    input,
    setInput,
    attachments,
    sendMessage,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
  ]);

  // Document processor hook
  const documentProcessor = useDocumentProcessor({
    onDocumentProcessed: (attachment) => {
      setAttachments(prev => [...prev, attachment]);
    },
    onProcessingStateChange: (fileId, isProcessing) => {
      // Processing state is managed internally by the processor
    }
  });

  // Handle file uploads from both drag/drop and file picker
  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;

        return {
          url,
          name: pathname,
          contentType: contentType,
        };
      }
      const { error } = await response.json();
      return null;
    } catch (error) {
      return null;
    }
  };

  const handleFileSelect = async (files: File[]) => {
    // Separate documents from regular files
    const documentFiles: File[] = [];
    const regularFiles: File[] = [];

    files.forEach(file => {
      const documentTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'text/plain',
      ];
      
      if (documentTypes.includes(file.type)) {
        documentFiles.push(file);
      } else {
        regularFiles.push(file);
      }
    });

    // Process documents
    const processedAttachments = await documentProcessor.processMultipleFiles(documentFiles);

    // Upload regular files
    const uploadPromises = regularFiles.map(uploadFile);
    const uploadResults = await Promise.allSettled(uploadPromises);
    
    const uploadedAttachments = uploadResults
      .filter((result): result is PromiseFulfilledResult<Attachment | null> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value!);

    // Add all attachments
    const allAttachments = [...uploadedAttachments];
    if (allAttachments.length > 0) {
      setAttachments(prev => [...prev, ...allAttachments]);
    }
  };

  // Voice recording handlers
  const handleRecordingStart = () => {
    setIsRecording(true);
  };

  const handleRecordingStop = async (audioBlob: Blob) => {
    setIsRecording(false);
    
    const audioFile = new File([audioBlob], `voice-note-${Date.now()}.wav`, {
      type: 'audio/wav',
    });
    
    const attachment = await uploadFile(audioFile);
    if (attachment) {
      setAttachments(prev => [...prev, attachment]);
    }
  };

  const handleRecordingError = (error: string) => {
    setIsRecording(false);
  };

  const { isAtBottom, scrollToBottom } = useScrollToBottom();

  useEffect(() => {
    if (status === 'submitted') {
      scrollToBottom();
    }
  }, [status, scrollToBottom]);

  // Track drag state for FileUploadHandler
  const [isDragging, setIsDragging] = useState(false);

  return (
    <FileUploadHandler
      onFileSelect={handleFileSelect}
      onDragStateChange={setIsDragging}
    >
      {({ fileInputRef, isDragging: dragState, handleFileSelect: openFileDialog, handleDragEnter, handleDragLeave, handleDragOver, handleDrop }) => (
        <div 
          className="flex relative flex-col gap-4 w-full"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <AnimatePresence>
            {!isAtBottom && messages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="absolute bottom-28 left-1/2 z-50 -translate-x-1/2"
              >
                <Button
                  data-testid="scroll-to-bottom-button"
                  className="rounded-full"
                  size="icon"
                  variant="outline"
                  onClick={(event) => {
                    event.preventDefault();
                    scrollToBottom();
                  }}
                >
                  <ArrowDown />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <PromptInput
            className="border-2 border-border/50 rounded-3xl shadow-sm transition-all duration-200 hover:border-border focus-within:border-muted-foreground/50"
            onSubmit={(event) => {
              event.preventDefault();
              if (status !== 'ready') {
                toast.error('Please wait for the model to finish its response!');
              } else {
                submitForm();
              }
            }}
          >
            <AttachmentManager
              attachments={attachments}
              onAttachmentsChange={setAttachments}
              processingDocuments={documentProcessor.processingDocuments}
            />

            <PromptInputTextarea
              ref={textareaRef}
              placeholder={dragState ? "Drop documents here to process with AI..." : "Send a message..."}
              value={input}
              onChange={handleInput}
              className={`text-sm resize-none border-b-0 focus:border-0 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-6 py-4 w-full ${
                dragState ? 'bg-blue-50' : ''
              }`}
              onKeyDown={(event) => {
                // Prevent Tab from switching focus when command menu is open
                if (event.key === 'Tab' && menuState.isOpen) {
                  event.preventDefault();
                  return;
                }
                
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  if (status === 'in_progress') {
                    stop();
                  } else {
                    submitForm();
                  }
                }
              }}
              rows={3}
            />
            <PromptInputToolbar className="px-2 py-1 border-t-0">
              <PromptInputTools className="gap-2">
                {/* Empty left side */}
              </PromptInputTools>
              <div className="flex items-center gap-1">
                <AttachmentsButton onFileSelect={openFileDialog} status={status} />
                <DocumentUploadButton onFileSelect={openFileDialog} status={status} />
                <VoiceRecorder
                  isRecording={isRecording}
                  onRecordingStart={handleRecordingStart}
                  onRecordingStop={handleRecordingStop}
                  onRecordingError={handleRecordingError}
                />
                {status === 'submitted' || status === 'streaming' ? (
                  <StopButton stop={stop} setMessages={setMessages} />
                ) : (
                  <PromptInputSubmit
                    status={status}
                    disabled={!input.trim() || documentProcessor.isProcessing}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground size-8"
                    size="sm"
                  />
                )}
              </div>
            </PromptInputToolbar>
          </PromptInput>

          {messages.length === 0 &&
            attachments.length === 0 &&
            !documentProcessor.isProcessing && (
              <QuickActions
                setInput={setInput}
                chatId={chatId}
                selectedVisibilityType={selectedVisibilityType}
                inputRef={textareaRef}
              />
            )}

          {/* Command Menu for slash commands and @ mentions */}
          <CommandMenu
            isOpen={menuState.isOpen}
            onClose={closeMenu}
            onSelect={(command) => {
              console.log('CommandMenu onSelect called with command:', command);
              console.log('Current input at time of selection:', input);
              console.log('Textarea value at time of selection:', textareaRef.current?.value);
              // Use the actual textarea value instead of the potentially stale input prop
              const currentText = textareaRef.current?.value || input;
              insertCommand(command, setInput, currentText);
            }}
            position={menuState.position}
            filter={menuState.filter}
            mode={menuState.mode || 'slash'}
            entityType={menuState.entityType}
          />
        </div>
      )}
    </FileUploadHandler>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.status !== nextProps.status) return false;
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false;

    return true;
  },
);

function PureAttachmentsButton({
  onFileSelect,
  status,
}: {
  onFileSelect: () => void;
  status: UseChatHelpers<ChatMessage>['status'];
}) {
  return (
    <Button
      data-testid="attachments-button"
      className="bg-primary hover:bg-primary/90 text-primary-foreground size-8"
      onClick={(event) => {
        event.preventDefault();
        onFileSelect();
      }}
      disabled={status !== 'ready'}
      size="sm"
    >
      <Share2Icon className="size-4" />
    </Button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
}) {
  return (
    <Button
      data-testid="stop-button"
      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground size-8"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
      size="sm"
    >
      <SquareIcon className="size-3" />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

// VoiceButton is now replaced by the VoiceRecorder component

function PureDocumentUploadButton({
  onFileSelect,
  status,
}: {
  onFileSelect: () => void;
  status: UseChatHelpers<ChatMessage>['status'];
}) {
  return (
    <Button
      data-testid="document-upload-button"
      className="bg-green-600 hover:bg-green-700 text-white size-8"
      onClick={(event) => {
        event.preventDefault();
        onFileSelect();
      }}
      disabled={status !== 'ready'}
      size="sm"
      title="Upload documents (PDF, DOCX, XLSX, CSV, TXT) for AI processing"
    >
      <FileTextIcon className="size-4" />
    </Button>
  );
}

const DocumentUploadButton = memo(PureDocumentUploadButton);

function PureSendButton({
  submitForm,
  input,
  uploadQueue,
}: {
  submitForm: () => void;
  input: string;
  uploadQueue: Array<string>;
}) {
  return (
    <Button
      data-testid="send-button"
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
      disabled={input.length === 0 || uploadQueue.length > 0}
    >
      <ArrowUpIcon size={14} />
    </Button>
  );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.uploadQueue.length !== nextProps.uploadQueue.length)
    return false;
  if (prevProps.input !== nextProps.input) return false;
  return true;
});
