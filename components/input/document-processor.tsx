'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import type { Attachment } from '@/lib/types';
import { useUploadDocument } from '@/lib/hooks/use-documents';

interface DocumentProcessorProps {
  onDocumentProcessed: (attachment: Attachment) => void;
  onProcessingStateChange: (fileId: string, isProcessing: boolean) => void;
}

export function useDocumentProcessor({
  onDocumentProcessed,
  onProcessingStateChange
}: DocumentProcessorProps) {
  const { data: session } = useSession();
  const uploadDocument = useUploadDocument();
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);
  const [processingDocuments, setProcessingDocuments] = useState<Set<string>>(new Set());

  const processDocument = useCallback(async (file: File): Promise<Attachment | null> => {
    const fileId = `${file.name}-${Date.now()}`;
    
    // Check if we have the required session data
    if (!session?.user?.organizationId) {
      toast.error('Authentication required. Please sign in to upload documents.');
      return null;
    }
    
    // Add to processing set
    setProcessingDocuments(prev => {
      const newSet = new Set(prev);
      newSet.add(fileId);
      return newSet;
    });
    
    onProcessingStateChange(fileId, true);

    try {
      // Create initial attachment
      const attachment: Attachment = {
        name: file.name,
        contentType: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        metadata: {
          processing: true,
          fileId
        }
      };

      // If it's a document type that needs processing, upload it
      const documentTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv'
      ];

      if (documentTypes.includes(file.type)) {
        // Add to upload queue
        setUploadQueue(prev => [...prev, fileId]);

        try {
          const result = await uploadDocument.mutateAsync({
            file,
            organizationId: session?.user?.organizationId,
            workspaceId: session?.user?.workspaceId,
            options: {
              generateEmbeddings: true,
              performOCR: file.type === 'application/pdf',
              category: 'chat-upload'
            }
          });

          // Update attachment with processed data
          const processedAttachment: Attachment = {
            ...attachment,
            metadata: {
              ...attachment.metadata,
              processing: false,
              processed: true,
              documentId: result.documentId,
              textLength: result.textLength,
              chunks: result.chunks
            }
          };

          onDocumentProcessed(processedAttachment);
          toast.success(`Document "${file.name}" processed successfully`);
          return processedAttachment;
        } catch (error) {
          console.error('Document processing failed:', error);
          toast.error(`Failed to process "${file.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
          
          // Return basic attachment without processing
          const basicAttachment: Attachment = {
            ...attachment,
            metadata: {
              ...attachment.metadata,
              processing: false,
              processed: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          };
          
          return basicAttachment;
        } finally {
          // Remove from upload queue
          setUploadQueue(prev => prev.filter(id => id !== fileId));
        }
      } else {
        // For non-document files (images, etc.), return immediately
        const basicAttachment: Attachment = {
          ...attachment,
          metadata: {
            ...attachment.metadata,
            processing: false,
            processed: false
          }
        };

        onDocumentProcessed(basicAttachment);
        return basicAttachment;
      }
    } finally {
      // Remove from processing set
      setProcessingDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
      
      onProcessingStateChange(fileId, false);
    }
  }, [session?.user?.organizationId, session?.user?.workspaceId, uploadDocument, onDocumentProcessed, onProcessingStateChange]);

  const processMultipleFiles = useCallback(async (files: File[]) => {
    const results = await Promise.allSettled(
      files.map(file => processDocument(file))
    );

    const successful = results
      .filter((result): result is PromiseFulfilledResult<Attachment | null> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value!);

    const failed = results.filter(result => result.status === 'rejected').length;

    if (failed > 0) {
      toast.error(`${failed} file(s) failed to process`);
    }

    return successful;
  }, [processDocument]);

  return {
    processDocument,
    processMultipleFiles,
    uploadQueue,
    processingDocuments,
    isProcessing: uploadQueue.length > 0 || processingDocuments.size > 0
  };
}