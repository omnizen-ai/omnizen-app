import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

export interface Document {
  id: string;
  title: string;
  file_name: string;
  file_type: 'pdf' | 'csv' | 'xlsx' | 'docx' | 'txt' | 'image' | 'receipt' | 'invoice' | 'contract' | 'statement' | 'other';
  file_size: number;
  status: 'uploaded' | 'processing' | 'processed' | 'failed' | 'archived';
  category?: string;
  tags: string[];
  text_length?: number;
  created_at: string;
  updated_at: string;
  processed_at?: string;
}

export interface UploadOptions {
  workspaceId?: string;
  category?: string;
  tags?: string[];
  generateEmbeddings?: boolean;
  performOCR?: boolean;
  chunkSize?: number;
  chunkOverlap?: number;
}

export interface UploadResult {
  success: boolean;
  documentId?: string;
  fileName: string;
  fileSize: number;
  textLength?: number;
  chunks?: number;
  processingTime: number;
  storageUrl: string;
}

export interface SearchOptions {
  query: string;
  workspaceId?: string;
  limit?: number;
  minSimilarity?: number;
  documentTypes?: string[];
  categories?: string[];
}

export interface SearchResult {
  documentId: string;
  content: string;
  similarity: number;
  metadata: {
    title?: string;
    fileType?: string;
    category?: string;
    chunkIndex?: number;
    page?: number;
  };
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  searchTime: number;
  metadata: {
    totalResults: number;
    minSimilarity: number;
    searchedTypes: string[] | 'all';
    searchedCategories: string[] | 'all';
  };
}

export interface DocumentsResponse {
  documents: Document[];
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface SearchSuggestion {
  documentId: string;
  title: string;
  snippet: string;
  similarity: number;
  fileType?: string;
}

// Hook for fetching documents list
export function useDocuments(filters?: {
  limit?: number;
  offset?: number;
  status?: string;
  fileType?: string;
  category?: string;
}) {
  return useQuery({
    queryKey: ['documents', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.limit) params.set('limit', filters.limit.toString());
      if (filters?.offset) params.set('offset', filters.offset.toString());
      if (filters?.status) params.set('status', filters.status);
      if (filters?.fileType) params.set('fileType', filters.fileType);
      if (filters?.category) params.set('category', filters.category);
      
      return apiClient.get<DocumentsResponse>(`/api/documents/upload?${params.toString()}`);
    },
  });
}

// Hook for uploading documents
export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      file, 
      options, 
      organizationId,
      workspaceId 
    }: { 
      file: File; 
      options?: UploadOptions;
      organizationId?: string;
      workspaceId?: string;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      
      if (options) {
        formData.append('options', JSON.stringify(options));
      }

      // Prepare headers
      const headers: Record<string, string> = {};
      if (organizationId) {
        headers['x-organization-id'] = organizationId;
      }
      if (workspaceId) {
        headers['x-workspace-id'] = workspaceId;
      }

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          const error = await response.json();
          
          // Handle different error response structures
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (typeof error.message === 'string') {
            errorMessage = error.message;
          } else if (typeof error.error === 'object' && error.error?.message) {
            errorMessage = error.error.message;
          } else if (typeof error === 'string') {
            errorMessage = error;
          } else {
            errorMessage = `Upload failed with status ${response.status}`;
          }
        } catch (parseError) {
          // If we can't parse the error response, use the status text
          errorMessage = `Upload failed: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      return response.json() as Promise<UploadResult>;
    },
    onSuccess: (data) => {
      // Invalidate documents list to refresh
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      
      toast.success(`Document "${data.fileName}" processed successfully`, {
        description: `${data.textLength} characters extracted${data.chunks ? `, ${data.chunks} chunks created` : ''}`,
      });
    },
    onError: (error) => {
      toast.error('Upload failed', {
        description: error.message,
      });
    },
  });
}

// Hook for searching documents
export function useSearchDocuments() {
  return useMutation({
    mutationFn: async (options: SearchOptions) => {
      return apiClient.post<SearchResponse>('/api/documents/search', options);
    },
  });
}

// Hook for search suggestions
export function useSearchSuggestions(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['document-suggestions', query],
    queryFn: async () => {
      const params = new URLSearchParams({ q: query });
      const response = await fetch(`/api/documents/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to get suggestions');
      }
      
      const data = await response.json();
      return data.suggestions as SearchSuggestion[];
    },
    enabled: enabled && query.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for document analytics
export function useDocumentAnalytics() {
  return useQuery({
    queryKey: ['document-analytics'],
    queryFn: async () => {
      return apiClient.get<{
        totalDocuments: number;
        totalSize: number;
        byStatus: Record<string, number>;
        byType: Record<string, number>;
        byCategory: Record<string, number>;
        processingStats: {
          avgProcessingTime: number;
          successRate: number;
          totalChunks: number;
        };
      }>('/api/documents/analytics');
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Helper function to format file size
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

// Helper function to get file type icon
export function getFileTypeIcon(fileType: string): string {
  const icons: Record<string, string> = {
    pdf: '📄',
    docx: '📝',
    xlsx: '📊',
    csv: '📈',
    txt: '📃',
    image: '🖼️',
    receipt: '🧾',
    invoice: '💰',
    contract: '📋',
    statement: '📊',
    other: '📁',
  };
  
  return icons[fileType] || icons.other;
}

// Helper function to get status color
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    uploaded: 'bg-blue-100 text-blue-800',
    processing: 'bg-yellow-100 text-yellow-800',
    processed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    archived: 'bg-gray-100 text-gray-800',
  };
  
  return colors[status] || colors.uploaded;
}