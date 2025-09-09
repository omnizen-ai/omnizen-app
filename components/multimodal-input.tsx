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
import { FileTextIcon } from '@radix-ui/react-icons';
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
import { EnhancedTextarea } from './autocomplete';
import { transcriptionService } from '@/lib/ai/transcription';

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

  const handleInput = (newValue: string) => {
    setInput(newValue);
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


  const handleFileSelect = async (files: File[]) => {
    // Process all files through the document processor
    // The processor will handle documents with AI processing and images/other files as basic attachments
    await documentProcessor.processMultipleFiles(files);
  };

  // Voice recording handlers
  const handleRecordingStart = () => {
    setIsRecording(true);
  };

  const uploadVoiceMessage = async (audioFile: File): Promise<Attachment | null> => {
    try {
      // Upload audio file to voice-messages bucket
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('options', JSON.stringify({
        bucket: 'voice-messages',
        category: 'voice-messages',
      }));

      const response = await fetch('/api/storage/files', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      // Start transcription in background
      const transcriptionPromise = transcriptionService.transcribeAudio(
        new Uint8Array(await audioFile.arrayBuffer())
      );

      // Create attachment immediately with audio file
      const attachment: Attachment = {
        name: audioFile.name,
        url: result.data.publicUrl || result.data.filePath,
        contentType: audioFile.type,
        size: audioFile.size,
        metadata: {
          bucket: 'voice-messages',
          duration: 0, // Will be updated after transcription
          isVoiceMessage: true,
          transcribing: true,
        }
      };

      // Handle transcription result asynchronously
      transcriptionPromise.then(async (transcriptionResult) => {
        if (transcriptionResult.success && transcriptionResult.transcript) {
          // Update attachment with transcript
          const updatedAttachment: Attachment = {
            ...attachment,
            metadata: {
              ...attachment.metadata,
              transcript: transcriptionResult.transcript,
              transcriptSegments: transcriptionResult.segments,
              duration: transcriptionResult.duration,
              transcriptionConfidence: transcriptionResult.confidence,
              transcribing: false,
            }
          };

          // Update the attachments state to reflect transcription completion
          setAttachments(prev => 
            prev.map(att => 
              att.url === attachment.url ? updatedAttachment : att
            )
          );

          // Show success toast
          toast.success('Voice message transcribed successfully');
        } else {
          // Update attachment to show transcription failed
          const updatedAttachment: Attachment = {
            ...attachment,
            metadata: {
              ...attachment.metadata,
              transcribing: false,
              transcriptionError: transcriptionResult.error,
            }
          };

          setAttachments(prev => 
            prev.map(att => 
              att.url === attachment.url ? updatedAttachment : att
            )
          );

          toast.error('Failed to transcribe voice message');
        }
      });

      return attachment;

    } catch (error) {
      console.error('Voice message upload failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload voice message');
      return null;
    }
  };

  const handleRecordingStop = async (audioBlob: Blob) => {
    setIsRecording(false);
    
    const audioFile = new File([audioBlob], `voice-note-${Date.now()}.wav`, {
      type: 'audio/wav',
    });
    
    const attachment = await uploadVoiceMessage(audioFile);
    if (attachment) {
      setAttachments(prev => [...prev, attachment]);
      toast.success('Voice message uploaded');
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

            <EnhancedTextarea
              ref={textareaRef}
              placeholder={dragState ? "Drop documents here to process with AI..." : "Send a message..."}
              value={input}
              onChange={handleInput}
              className={`text-sm resize-none border-b-0 focus:border-0 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-6 py-4 w-full ${
                dragState ? 'bg-blue-50' : ''
              }`}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  if (status === 'in_progress') {
                    stop();
                  } else {
                    submitForm();
                  }
                }
              }}
              disabled={status !== 'ready'}
            />
            <PromptInputToolbar className="px-2 py-1 border-t-0">
              <PromptInputTools className="gap-2">
                {/* Empty left side */}
              </PromptInputTools>
              <div className="flex items-center gap-1">
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
      title="Upload files (PDF, DOCX, XLSX, CSV, TXT, images) - documents get AI processing"
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
