'use client';

import type { UIMessage } from 'ai';
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
  memo,
} from 'react';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';

import { ArrowUpIcon, } from './icons';
import { Share2Icon, RadiobuttonIcon, MaskOnIcon, FileTextIcon } from '@radix-ui/react-icons';
import { SquareIcon, ArrowDown, Upload } from 'lucide-react';
import { PreviewAttachment } from './preview-attachment';
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
import { useUploadDocument } from '@/lib/hooks/use-documents';

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

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Document processing
  const uploadDocument = useUploadDocument();
  const [isDragOver, setIsDragOver] = useState(false);
  const [processingDocuments, setProcessingDocuments] = useState<Set<string>>(new Set());

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
      toast.error(error);
    } catch (error) {
      toast.error('Failed to upload file, please try again!');
    }
  };

  // Document-specific file types that should be processed for RAG
  const isDocumentFile = (file: File) => {
    const documentTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain',
    ];
    return documentTypes.includes(file.type) || file.name.endsWith('.pdf') || file.name.endsWith('.docx') || file.name.endsWith('.xlsx');
  };

  const processDocument = async (file: File) => {
    const fileName = file.name;
    setProcessingDocuments(prev => new Set(prev.add(fileName)));
    
    try {
      await uploadDocument.mutateAsync({ 
        file, 
        options: {
          category: 'chat-uploaded',
          generateEmbeddings: true,
          performOCR: true,
        }
      });
      
      // Add a text attachment showing document was processed
      const documentAttachment = {
        url: `/documents/${fileName}`,
        name: `📄 ${fileName} (Processed for AI search)`,
        contentType: 'text/plain',
      };
      
      setAttachments(prev => [...prev, documentAttachment]);
      toast.success(`Document "${fileName}" processed and available for AI search`);
    } catch (error) {
      toast.error(`Failed to process document "${fileName}"`);
    } finally {
      setProcessingDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileName);
        return newSet;
      });
    }
  };

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      
      // Separate documents from regular files
      const documentFiles = files.filter(isDocumentFile);
      const regularFiles = files.filter(file => !isDocumentFile(file));

      setUploadQueue(regularFiles.map((file) => file.name));

      try {
        // Process documents for RAG
        for (const docFile of documentFiles) {
          await processDocument(docFile);
        }

        // Handle regular file uploads
        if (regularFiles.length > 0) {
          const uploadPromises = regularFiles.map((file) => uploadFile(file));
          const uploadedAttachments = await Promise.all(uploadPromises);
          const successfullyUploadedAttachments = uploadedAttachments.filter(
            (attachment) => attachment !== undefined,
          );

          setAttachments((currentAttachments) => [
            ...currentAttachments,
            ...successfullyUploadedAttachments,
          ]);
        }
      } catch (error) {
        console.error('Error uploading files!', error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments],
  );

  const { isAtBottom, scrollToBottom } = useScrollToBottom();

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      // Process the dropped files same as file input
      const documentFiles = files.filter(isDocumentFile);
      const regularFiles = files.filter(file => !isDocumentFile(file));

      setUploadQueue(regularFiles.map((file) => file.name));

      try {
        // Process documents for RAG
        for (const docFile of documentFiles) {
          await processDocument(docFile);
        }

        // Handle regular file uploads
        if (regularFiles.length > 0) {
          const uploadPromises = regularFiles.map((file) => uploadFile(file));
          const uploadedAttachments = await Promise.all(uploadPromises);
          const successfullyUploadedAttachments = uploadedAttachments.filter(
            (attachment) => attachment !== undefined,
          );

          setAttachments((currentAttachments) => [
            ...currentAttachments,
            ...successfullyUploadedAttachments,
          ]);
        }
      } catch (error) {
        console.error('Error uploading dropped files!', error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments],
  );

  useEffect(() => {
    if (status === 'submitted') {
      scrollToBottom();
    }
  }, [status, scrollToBottom]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, {
          type: 'audio/webm',
        });
        
        // Upload the voice note
        const attachment = await uploadFile(audioFile);
        if (attachment) {
          setAttachments((current) => [...current, attachment]);
          toast.success('Voice note recorded');
        }
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div 
      className={`flex relative flex-col gap-4 w-full ${
        isDragOver ? 'bg-blue-50 border-2 border-blue-300 border-dashed rounded-lg' : ''
      }`}
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

      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        accept="image/*,audio/*,video/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain"
        onChange={handleFileChange}
        tabIndex={-1}
      />

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
        {(attachments.length > 0 || uploadQueue.length > 0 || processingDocuments.size > 0) && (
          <div
            data-testid="attachments-preview"
            className="flex overflow-x-scroll flex-row gap-2 items-end px-3 py-2"
          >
            {attachments.map((attachment) => (
              <PreviewAttachment
                key={attachment.url}
                attachment={attachment}
                onRemove={() => {
                  setAttachments((currentAttachments) =>
                    currentAttachments.filter((a) => a.url !== attachment.url),
                  );
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              />
            ))}

            {uploadQueue.map((filename) => (
              <PreviewAttachment
                key={filename}
                attachment={{
                  url: '',
                  name: filename,
                  contentType: '',
                }}
                isUploading={true}
              />
            ))}

            {Array.from(processingDocuments).map((filename) => (
              <PreviewAttachment
                key={`processing-${filename}`}
                attachment={{
                  url: '',
                  name: `📄 ${filename} (Processing...)`,
                  contentType: 'application/pdf',
                }}
                isUploading={true}
              />
            ))}
          </div>
        )}

        <PromptInputTextarea
          data-testid="multimodal-input"
          ref={textareaRef}
          placeholder={isDragOver ? "Drop documents here to process with AI..." : "Send a message..."}
          value={input}
          onChange={handleInput}
          minHeight={messages.length === 0 ? 80 : 40}
          maxHeight={messages.length === 0 ? 80 : 40}
          disableAutoResize={true}
          style={{ 
            height: messages.length === 0 ? '80px' : '40px', 
            minHeight: messages.length === 0 ? '80px' : '40px', 
            maxHeight: messages.length === 0 ? '80px' : '40px' 
          }}
          className={`text-sm resize-none border-b-0 focus:border-0 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-6 py-4 ${
            isDragOver ? 'bg-blue-50' : ''
          }`}
          rows={1}
          autoFocus
        />
        <PromptInputToolbar className="px-2 py-1 border-t-0">
          <PromptInputTools className="gap-2">
            {/* Empty left side */}
          </PromptInputTools>
          <div className="flex items-center gap-1">
            <AttachmentsButton fileInputRef={fileInputRef} status={status} />
            <DocumentUploadButton fileInputRef={fileInputRef} status={status} />
            <VoiceButton 
              isRecording={isRecording}
              startRecording={startRecording}
              stopRecording={stopRecording}
              status={status}
            />
            {status === 'submitted' || status === 'streaming' ? (
              <StopButton stop={stop} setMessages={setMessages} />
            ) : (
              <PromptInputSubmit
                status={status}
                disabled={!input.trim() || uploadQueue.length > 0}
                className="bg-primary hover:bg-primary/90 text-primary-foreground size-8"
                size="sm"
              />
            )}
          </div>
        </PromptInputToolbar>
      </PromptInput>

      {messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 && (
          <QuickActions
            setInput={setInput}
            chatId={chatId}
            selectedVisibilityType={selectedVisibilityType}
            inputRef={textareaRef}
          />
        )}
    </div>
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
  fileInputRef,
  status,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers<ChatMessage>['status'];
}) {
  return (
    <Button
      data-testid="attachments-button"
      className="bg-primary hover:bg-primary/90 text-primary-foreground size-8"
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
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

function PureVoiceButton({
  isRecording,
  startRecording,
  stopRecording,
  status,
}: {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  status: UseChatHelpers<ChatMessage>['status'];
}) {
  return (
    <Button
      data-testid="voice-button"
      className={`size-8 transition-all ${
        isRecording 
          ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
          : 'bg-primary hover:bg-primary/90 text-primary-foreground'
      }`}
      onClick={(event) => {
        event.preventDefault();
        if (isRecording) {
          stopRecording();
        } else {
          startRecording();
        }
      }}
      disabled={status !== 'ready'}
      size="sm"
      type="button"
    >
      {isRecording ? (
        <MaskOnIcon className="size-4" />
      ) : (
        <RadiobuttonIcon className="size-4" />
      )}
    </Button>
  );
}

const VoiceButton = memo(PureVoiceButton);

function PureDocumentUploadButton({
  fileInputRef,
  status,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers<ChatMessage>['status'];
}) {
  const documentInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={documentInputRef}
        multiple
        accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain"
        onChange={(e) => {
          // Trigger the main file handler
          if (fileInputRef.current) {
            fileInputRef.current.files = e.target.files;
            fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }}
        tabIndex={-1}
      />
      <Button
        data-testid="document-upload-button"
        className="bg-green-600 hover:bg-green-700 text-white size-8"
        onClick={(event) => {
          event.preventDefault();
          documentInputRef.current?.click();
        }}
        disabled={status !== 'ready'}
        size="sm"
        title="Upload documents (PDF, DOCX, XLSX, CSV, TXT) for AI processing"
      >
        <FileTextIcon className="size-4" />
      </Button>
    </>
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
