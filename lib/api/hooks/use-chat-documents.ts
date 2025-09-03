import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Document } from '@/lib/db/schema';

async function fetchDocuments(documentId: string) {
  if (!documentId || documentId === 'null') {
    throw new Error('Invalid document ID');
  }
  
  const response = await fetch(`/api/document?id=${documentId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch documents');
  }
  
  return response.json() as Promise<Array<Document>>;
}

async function updateDocument({
  documentId,
  title,
  content,
  kind,
}: {
  documentId: string;
  title: string;
  content: string;
  kind: string;
}) {
  const response = await fetch(`/api/document?id=${documentId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, content, kind }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update document');
  }
  
  return response.json();
}

async function restoreDocumentVersion({
  documentId,
  timestamp,
}: {
  documentId: string;
  timestamp: string;
}) {
  const response = await fetch(
    `/api/document?id=${documentId}&timestamp=${timestamp}`,
    { method: 'POST' }
  );
  
  if (!response.ok) {
    throw new Error('Failed to restore document version');
  }
  
  return response.json();
}

export function useChatDocuments(documentId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['documents', documentId],
    queryFn: () => fetchDocuments(documentId!),
    enabled: enabled && !!documentId && documentId !== 'init' && documentId !== 'null',
    staleTime: 10 * 1000, // 10 seconds
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // Don't retry on invalid document ID
      if (error?.message === 'Invalid document ID') {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateDocument,
    onMutate: async ({ documentId, content, title, kind }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['documents', documentId] });
      
      // Snapshot the previous value
      const previousDocuments = queryClient.getQueryData<Array<Document>>(['documents', documentId]);
      
      // Optimistically update to the new value
      if (previousDocuments) {
        const currentDocument = previousDocuments.at(-1);
        if (currentDocument) {
          const newDocument = {
            ...currentDocument,
            content,
            title,
            kind,
            createdAt: new Date(),
          };
          queryClient.setQueryData(['documents', documentId], [...previousDocuments, newDocument]);
        }
      }
      
      // Return a context object with the snapshotted value
      return { previousDocuments, documentId };
    },
    onError: (_err, _variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousDocuments) {
        queryClient.setQueryData(['documents', context.documentId], context.previousDocuments);
      }
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['documents', variables.documentId] });
    },
  });
}

export function useRestoreDocumentVersion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: restoreDocumentVersion,
    onSuccess: (_, variables) => {
      // Invalidate documents to refetch
      queryClient.invalidateQueries({ 
        queryKey: ['documents', variables.documentId] 
      });
    },
  });
}