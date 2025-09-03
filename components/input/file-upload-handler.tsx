'use client';

import { useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { Attachment } from '@/lib/types';

interface FileUploadHandlerProps {
  onFileSelect: (files: File[]) => void;
  onDragStateChange: (isDragging: boolean) => void;
  children: (props: {
    fileInputRef: React.RefObject<HTMLInputElement>;
    isDragging: boolean;
    handleFileSelect: () => void;
    handleDragEnter: (e: React.DragEvent) => void;
    handleDragLeave: (e: React.DragEvent) => void;
    handleDragOver: (e: React.DragEvent) => void;
    handleDrop: (e: React.DragEvent) => void;
  }) => React.ReactNode;
}

export function FileUploadHandler({ 
  onFileSelect, 
  onDragStateChange,
  children 
}: FileUploadHandlerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validateFiles = (files: File[]): File[] => {
    const validFiles: File[] = [];
    const maxFileSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'text/plain', 'text/csv',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    for (const file of files) {
      if (file.size > maxFileSize) {
        toast.error(`File "${file.name}" is too large. Maximum size is 100MB.`);
        continue;
      }

      if (!allowedTypes.includes(file.type)) {
        toast.error(`File type "${file.type}" is not supported.`);
        continue;
      }

      validFiles.push(file);
    }

    return validFiles;
  };

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = validateFiles(files);
    
    if (validFiles.length > 0) {
      onFileSelect(validFiles);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFileSelect]);

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    onDragStateChange(true);
  }, [onDragStateChange]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    onDragStateChange(false);
  }, [onDragStateChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    onDragStateChange(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = validateFiles(files);
    
    if (validFiles.length > 0) {
      onFileSelect(validFiles);
    }
  }, [onFileSelect, onDragStateChange]);

  return (
    <>
      {children({
        fileInputRef,
        isDragging,
        handleFileSelect,
        handleDragEnter,
        handleDragLeave,
        handleDragOver,
        handleDrop
      })}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.txt,.csv,.docx,.xlsx"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </>
  );
}