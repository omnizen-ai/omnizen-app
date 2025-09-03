'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PreviewAttachment } from '@/components/preview-attachment';
import type { Attachment } from '@/lib/types';

interface AttachmentManagerProps {
  attachments: Array<Attachment>;
  onAttachmentsChange: (attachments: Array<Attachment>) => void;
  processingDocuments?: Set<string>;
}

export function AttachmentManager({
  attachments,
  onAttachmentsChange,
  processingDocuments = new Set()
}: AttachmentManagerProps) {
  const removeAttachment = useCallback((index: number) => {
    const newAttachments = [...attachments];
    const attachment = newAttachments[index];
    
    // Revoke object URL to prevent memory leaks
    if (attachment.url && attachment.url.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.url);
    }
    
    newAttachments.splice(index, 1);
    onAttachmentsChange(newAttachments);
  }, [attachments, onAttachmentsChange]);

  const addAttachment = useCallback((attachment: Attachment) => {
    onAttachmentsChange([...attachments, attachment]);
  }, [attachments, onAttachmentsChange]);

  const updateAttachment = useCallback((index: number, updates: Partial<Attachment>) => {
    const newAttachments = [...attachments];
    newAttachments[index] = { ...newAttachments[index], ...updates };
    onAttachmentsChange(newAttachments);
  }, [attachments, onAttachmentsChange]);

  const clearAttachments = useCallback(() => {
    // Revoke all object URLs
    attachments.forEach(attachment => {
      if (attachment.url && attachment.url.startsWith('blob:')) {
        URL.revokeObjectURL(attachment.url);
      }
    });
    onAttachmentsChange([]);
  }, [attachments, onAttachmentsChange]);

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 p-2">
      <AnimatePresence mode="popLayout">
        {attachments.map((attachment, index) => {
          const isProcessing = attachment.metadata?.processing || 
            (attachment.metadata?.fileId && processingDocuments.has(attachment.metadata.fileId));

          return (
            <motion.div
              key={`${attachment.name}-${index}`}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ 
                type: "spring", 
                stiffness: 500, 
                damping: 30,
                opacity: { duration: 0.2 }
              }}
            >
              <PreviewAttachment
                attachment={attachment}
                isRemoving={false}
                isProcessing={isProcessing}
                onRemove={() => removeAttachment(index)}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function useAttachmentManager(initialAttachments: Array<Attachment> = []) {
  const [attachments, setAttachments] = useState<Array<Attachment>>(initialAttachments);

  const addAttachment = useCallback((attachment: Attachment) => {
    setAttachments(prev => [...prev, attachment]);
  }, []);

  const addMultipleAttachments = useCallback((newAttachments: Array<Attachment>) => {
    setAttachments(prev => [...prev, ...newAttachments]);
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => {
      const attachment = prev[index];
      
      // Revoke object URL to prevent memory leaks
      if (attachment.url && attachment.url.startsWith('blob:')) {
        URL.revokeObjectURL(attachment.url);
      }
      
      const newAttachments = [...prev];
      newAttachments.splice(index, 1);
      return newAttachments;
    });
  }, []);

  const updateAttachment = useCallback((index: number, updates: Partial<Attachment>) => {
    setAttachments(prev => {
      const newAttachments = [...prev];
      newAttachments[index] = { ...newAttachments[index], ...updates };
      return newAttachments;
    });
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachments(prev => {
      // Revoke all object URLs
      prev.forEach(attachment => {
        if (attachment.url && attachment.url.startsWith('blob:')) {
          URL.revokeObjectURL(attachment.url);
        }
      });
      return [];
    });
  }, []);

  return {
    attachments,
    setAttachments,
    addAttachment,
    addMultipleAttachments,
    removeAttachment,
    updateAttachment,
    clearAttachments
  };
}