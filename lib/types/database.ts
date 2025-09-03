/**
 * Database type definitions
 * This file provides centralized type exports for database entities
 */

// Export Supabase generated types
export type { Database, Json } from '@/lib/supabase/types';
export type { Database as SupabaseDatabase } from '@/lib/supabase/types';

// Import specific table types from Supabase
import type { Database } from '@/lib/supabase/types';

// Export specific table row types for easier access
export type DocumentRow = Database['public']['Tables']['documents']['Row'];
export type DocumentInsert = Database['public']['Tables']['documents']['Insert'];
export type DocumentUpdate = Database['public']['Tables']['documents']['Update'];

export type ContactRow = Database['public']['Tables']['contacts']['Row'];
export type ContactInsert = Database['public']['Tables']['contacts']['Insert'];
export type ContactUpdate = Database['public']['Tables']['contacts']['Update'];

export type BankTransactionRow = Database['public']['Tables']['bank_transactions']['Row'];
export type BankTransactionInsert = Database['public']['Tables']['bank_transactions']['Insert'];
export type BankTransactionUpdate = Database['public']['Tables']['bank_transactions']['Update'];

export type DocumentEmbeddingRow = Database['public']['Tables']['document_embeddings']['Row'];
export type DocumentEmbeddingInsert = Database['public']['Tables']['document_embeddings']['Insert'];
export type DocumentEmbeddingUpdate = Database['public']['Tables']['document_embeddings']['Update'];

export type DocumentProcessingJobRow = Database['public']['Tables']['document_processing_jobs']['Row'];
export type DocumentProcessingJobInsert = Database['public']['Tables']['document_processing_jobs']['Insert'];
export type DocumentProcessingJobUpdate = Database['public']['Tables']['document_processing_jobs']['Update'];

// Export enum types
export type DocumentType = Database['public']['Enums']['document_type'];
export type DocumentStatus = Database['public']['Enums']['document_status'];