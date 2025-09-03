import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  boolean,
  pgEnum,
  index,
  uniqueIndex,
  integer,
  decimal,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { organizations, workspaces } from '../core/organizations';
import { users } from '../core/users';
import { vector } from '../vectors/schema';

// Document types
export const documentTypeEnum = pgEnum('document_type', [
  'pdf',
  'csv', 
  'xlsx',
  'docx',
  'txt',
  'image',
  'receipt',
  'invoice',
  'contract',
  'statement',
  'other'
]);

// Document processing status
export const documentStatusEnum = pgEnum('document_status', [
  'uploaded',
  'processing',
  'processed', 
  'failed',
  'archived'
]);

// Documents table - Main document storage  
export const documentsTable = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  
  // Document identification
  title: text('title').notNull(),
  description: text('description'),
  fileName: text('file_name').notNull(),
  fileType: documentTypeEnum('file_type').notNull(),
  fileSize: integer('file_size').notNull(), // in bytes
  mimeType: text('mime_type'),
  
  // Storage information
  storageUrl: text('storage_url').notNull(), // Supabase Storage URL
  storageBucket: text('storage_bucket').notNull().default('documents'),
  storageKey: text('storage_key').notNull(), // Storage path key
  
  // Processing information
  status: documentStatusEnum('status').notNull().default('uploaded'),
  processedAt: timestamp('processed_at'),
  processingError: text('processing_error'),
  
  // Content extraction
  extractedText: text('extracted_text'), // Full extracted text
  textLength: integer('text_length'), // Length of extracted text
  language: text('language').default('en'), // Detected language
  
  // Document metadata
  metadata: jsonb('metadata').notNull().default({}),
  // Expected metadata structure:
  // {
  //   "pages": 5,
  //   "author": "John Doe", 
  //   "created_date": "2024-01-01",
  //   "custom_fields": {...}
  // }
  
  // Categorization
  category: text('category'), // business, personal, financial, legal, etc.
  tags: jsonb('tags').default('[]'), // Array of tags
  autoTags: jsonb('auto_tags').default('[]'), // AI-generated tags
  
  // Access control
  isPublic: boolean('is_public').notNull().default(false),
  allowedUsers: jsonb('allowed_users'), // Array of user IDs with access
  
  // Search optimization
  searchText: text('search_text'), // Full-text search optimized text
  
  // Relations to other entities
  relatedInvoiceId: uuid('related_invoice_id'), // Link to invoice if applicable
  relatedBillId: uuid('related_bill_id'), // Link to bill if applicable
  relatedContractId: uuid('related_contract_id'), // Link to contract if applicable
  
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgIdx: index('doc_org_idx').on(table.organizationId),
  workspaceIdx: index('doc_workspace_idx').on(table.workspaceId),
  statusIdx: index('doc_status_idx').on(table.status),
  typeIdx: index('doc_type_idx').on(table.fileType),
  categoryIdx: index('doc_category_idx').on(table.category),
  createdIdx: index('doc_created_idx').on(table.createdAt),
  storageKeyIdx: uniqueIndex('doc_storage_key_idx').on(table.storageKey),
}));

// Document embeddings table - Vector embeddings for semantic search
export const documentEmbeddings = pgTable('document_embeddings', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  documentId: uuid('document_id').notNull().references(() => documentsTable.id, { onDelete: 'cascade' }),
  
  // Chunk information
  chunkIndex: integer('chunk_index').notNull().default(0), // Order of chunk in document
  chunkCount: integer('chunk_count').notNull().default(1), // Total chunks in document
  
  // Content and embedding
  content: text('content').notNull(), // Text content of this chunk
  contentHash: text('content_hash'), // Hash for deduplication
  embedding: vector('embedding', { dimensions: 1536 }), // OpenAI ada-002/3 embedding
  
  // Chunk metadata
  metadata: jsonb('metadata').notNull().default({}),
  // Expected metadata structure:
  // {
  //   "page": 1,
  //   "section": "Introduction",
  //   "start_char": 0,
  //   "end_char": 1000,
  //   "confidence": 0.95
  // }
  
  // Categorization for filtering
  documentType: documentTypeEnum('document_type'),
  category: text('category'),
  
  // Search optimization
  searchText: text('search_text'), // Full-text search for this chunk
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgIdx: index('doc_emb_org_idx').on(table.organizationId),
  documentIdx: index('doc_emb_document_idx').on(table.documentId),
  chunkIdx: index('doc_emb_chunk_idx').on(table.documentId, table.chunkIndex),
  typeIdx: index('doc_emb_type_idx').on(table.documentType),
  categoryIdx: index('doc_emb_category_idx').on(table.category),
  // Vector similarity index will be created separately via migration
  hashIdx: index('doc_emb_hash_idx').on(table.contentHash),
}));

// Document processing jobs - Track async processing tasks
export const documentProcessingJobs = pgTable('document_processing_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  documentId: uuid('document_id').notNull().references(() => documentsTable.id, { onDelete: 'cascade' }),
  
  // Job details
  jobType: text('job_type').notNull(), // extract_text, generate_embeddings, ocr
  status: text('status').notNull().default('pending'), // pending, running, completed, failed
  
  // Progress tracking
  progress: integer('progress').default(0), // 0-100
  totalSteps: integer('total_steps').default(1),
  currentStep: integer('current_step').default(0),
  
  // Job configuration
  config: jsonb('config').notNull().default({}),
  
  // Results
  result: jsonb('result'),
  error: text('error'),
  
  // Timing
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  duration: integer('duration'), // in milliseconds
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  orgIdx: index('doc_job_org_idx').on(table.organizationId),
  documentIdx: index('doc_job_document_idx').on(table.documentId),
  statusIdx: index('doc_job_status_idx').on(table.status),
  typeIdx: index('doc_job_type_idx').on(table.jobType),
}));

// Document access logs - Track who accessed what documents
export const documentAccessLogs = pgTable('document_access_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  documentId: uuid('document_id').notNull().references(() => documentsTable.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  
  // Access details
  accessType: text('access_type').notNull(), // view, download, search, edit
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  
  // Context
  context: jsonb('context'), // Additional context like search query
  
  accessedAt: timestamp('accessed_at').notNull().defaultNow(),
}, (table) => ({
  orgIdx: index('doc_access_org_idx').on(table.organizationId),
  documentIdx: index('doc_access_document_idx').on(table.documentId),
  userIdx: index('doc_access_user_idx').on(table.userId),
  typeIdx: index('doc_access_type_idx').on(table.accessType),
  dateIdx: index('doc_access_date_idx').on(table.accessedAt),
}));

// Relations
export const documentsRelations = relations(documentsTable, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [documentsTable.organizationId],
    references: [organizations.id],
  }),
  workspace: one(workspaces, {
    fields: [documentsTable.workspaceId], 
    references: [workspaces.id],
  }),
  createdBy: one(users, {
    fields: [documentsTable.createdBy],
    references: [users.id],
  }),
  embeddings: many(documentEmbeddings),
  processingJobs: many(documentProcessingJobs),
  accessLogs: many(documentAccessLogs),
}));

export const documentEmbeddingsRelations = relations(documentEmbeddings, ({ one }) => ({
  organization: one(organizations, {
    fields: [documentEmbeddings.organizationId],
    references: [organizations.id],
  }),
  workspace: one(workspaces, {
    fields: [documentEmbeddings.workspaceId],
    references: [workspaces.id], 
  }),
  document: one(documentsTable, {
    fields: [documentEmbeddings.documentId],
    references: [documentsTable.id],
  }),
}));

export const documentProcessingJobsRelations = relations(documentProcessingJobs, ({ one }) => ({
  organization: one(organizations, {
    fields: [documentProcessingJobs.organizationId],
    references: [organizations.id],
  }),
  document: one(documentsTable, {
    fields: [documentProcessingJobs.documentId],
    references: [documentsTable.id],
  }),
}));

export const documentAccessLogsRelations = relations(documentAccessLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [documentAccessLogs.organizationId],
    references: [organizations.id],
  }),
  document: one(documentsTable, {
    fields: [documentAccessLogs.documentId],
    references: [documentsTable.id],
  }),
  user: one(users, {
    fields: [documentAccessLogs.userId],
    references: [users.id],
  }),
}));

// Types  
export type DocumentRecord = InferSelectModel<typeof documentsTable>;
export type DocumentEmbedding = InferSelectModel<typeof documentEmbeddings>;
export type DocumentProcessingJob = InferSelectModel<typeof documentProcessingJobs>;
export type DocumentAccessLog = InferSelectModel<typeof documentAccessLogs>;