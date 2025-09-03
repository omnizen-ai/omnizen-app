import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  boolean,
  pgEnum,
  index,
  integer,
  decimal,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { organizations, workspaces } from '../core/organizations';
import { users } from '../core/users';
import { vector } from '../vectors/schema';

// Query intent classification
export const queryIntentEnum = pgEnum('query_intent', [
  'read',      // SELECT queries
  'write',     // INSERT/UPDATE/DELETE
  'analyze',   // Analytical queries with aggregations
  'search',    // Full-text or semantic search
  'report',    // Complex reporting queries
  'admin',     // Schema or admin operations
  'unknown'    // Unclassified
]);

// Query complexity levels
export const queryComplexityEnum = pgEnum('query_complexity', [
  'simple',    // Single table, basic operations
  'moderate',  // Multiple tables, some joins
  'complex',   // Complex joins, subqueries, window functions
  'advanced'   // Very complex analytical queries
]);

// Batch processing status
export const batchStatusEnum = pgEnum('batch_status', [
  'pending',
  'processing',
  'completed',
  'failed'
]);

// Query intelligence - Main table for storing successful query patterns
export const queryIntelligence = pgTable('query_intelligence', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  
  // Query identification
  queryHash: text('query_hash').notNull(), // SHA-256 hash of normalized query
  queryPattern: text('query_pattern').notNull(), // Normalized query pattern
  originalQuery: text('original_query').notNull(), // Original SQL
  
  // Classification
  intent: queryIntentEnum('intent').notNull(),
  complexity: queryComplexityEnum('complexity').notNull(),
  tablesUsed: jsonb('tables_used').notNull().default('[]'), // Array of table names
  
  // Context and metadata
  userPrompt: text('user_prompt'), // Original user request that led to this query
  contextEmbedding: vector('context_embedding', { dimensions: 1536 }), // Embedding of user prompt
  queryEmbedding: vector('query_embedding', { dimensions: 1536 }), // Embedding of query pattern
  
  // Success metrics
  executionCount: integer('execution_count').notNull().default(1),
  totalExecutionTime: integer('total_execution_time').notNull().default(0), // milliseconds
  avgExecutionTime: decimal('avg_execution_time', { precision: 10, scale: 3 }),
  successRate: decimal('success_rate', { precision: 5, scale: 4 }).notNull().default('1.0000'),
  
  // Learning metrics
  similarity_searches: integer('similarity_searches').notNull().default(0), // How often this pattern was found via similarity
  adaptations: integer('adaptations').notNull().default(0), // How many times this was adapted for new contexts
  confidence_score: decimal('confidence_score', { precision: 5, scale: 4 }).notNull().default('0.5000'),
  
  // Metadata
  metadata: jsonb('metadata').notNull().default({}),
  // Expected metadata structure:
  // {
  //   "joins": ["inner", "left"],
  //   "aggregations": ["count", "sum"],
  //   "filters": ["where", "having"],
  //   "model_version": "v1.0",
  //   "business_domain": "finance"
  // }
  
  // Lifecycle
  firstSeen: timestamp('first_seen').notNull().defaultNow(),
  lastUsed: timestamp('last_used').notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgIdx: index('qi_org_idx').on(table.organizationId),
  workspaceIdx: index('qi_workspace_idx').on(table.workspaceId),
  hashIdx: uniqueIndex('qi_hash_idx').on(table.organizationId, table.queryHash),
  intentIdx: index('qi_intent_idx').on(table.intent),
  complexityIdx: index('qi_complexity_idx').on(table.complexity),
  confidenceIdx: index('qi_confidence_idx').on(table.confidence_score),
  lastUsedIdx: index('qi_last_used_idx').on(table.lastUsed),
  tablesIdx: index('qi_tables_idx').on(table.tablesUsed),
}));

// Query evolution - Track how queries adapt over time
export const queryEvolution = pgTable('query_evolution', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  parentQueryId: uuid('parent_query_id').notNull().references(() => queryIntelligence.id, { onDelete: 'cascade' }),
  
  // Evolution details
  originalContext: text('original_context').notNull(),
  newContext: text('new_context').notNull(),
  adaptationReason: text('adaptation_reason').notNull(), // Why the query was adapted
  
  // Adaptation metrics
  contextSimilarity: decimal('context_similarity', { precision: 5, scale: 4 }), // 0-1
  queryModifications: jsonb('query_modifications').notNull().default('[]'),
  // Expected structure:
  // [
  //   { "type": "table_substitution", "from": "users", "to": "customers" },
  //   { "type": "column_addition", "column": "created_at" },
  //   { "type": "filter_modification", "change": "date_range_extended" }
  // ]
  
  // Success tracking
  executionSuccess: boolean('execution_success').notNull(),
  executionTime: integer('execution_time'), // milliseconds
  resultQuality: decimal('result_quality', { precision: 5, scale: 4 }), // User feedback or automatic assessment
  
  // Learning data
  feedbackLoop: jsonb('feedback_loop').default('{}'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  orgIdx: index('qe_org_idx').on(table.organizationId),
  parentIdx: index('qe_parent_idx').on(table.parentQueryId),
  successIdx: index('qe_success_idx').on(table.executionSuccess),
  similarityIdx: index('qe_similarity_idx').on(table.contextSimilarity),
}));

// Batch processing jobs - Track batch query processing
export const queryBatchJobs = pgTable('query_batch_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  
  // Batch details
  batchId: text('batch_id').notNull(), // Redis batch identifier
  status: batchStatusEnum('status').notNull().default('pending'),
  totalQueries: integer('total_queries').notNull(),
  processedQueries: integer('processed_queries').notNull().default(0),
  failedQueries: integer('failed_queries').notNull().default(0),
  
  // Processing metrics
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  processingTime: integer('processing_time'), // milliseconds
  
  // Configuration
  config: jsonb('config').notNull().default('{}'),
  // Expected config:
  // {
  //   "min_execution_count": 2,
  //   "similarity_threshold": 0.8,
  //   "batch_size": 100,
  //   "embedding_model": "text-embedding-3-small"
  // }
  
  // Results
  results: jsonb('results'),
  errors: jsonb('errors'),
  
  // Trigger info
  triggeredBy: uuid('triggered_by').references(() => users.id),
  triggerReason: text('trigger_reason'), // 'scheduled', 'manual', 'threshold_reached'
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  orgIdx: index('qbj_org_idx').on(table.organizationId),
  statusIdx: index('qbj_status_idx').on(table.status),
  batchIdx: index('qbj_batch_idx').on(table.batchId),
  triggeredIdx: index('qbj_triggered_idx').on(table.triggeredBy),
}));

// Query patterns - Templates for common query structures
export const queryPatterns = pgTable('query_patterns', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  
  // Pattern identification
  patternName: text('pattern_name').notNull(),
  patternTemplate: text('pattern_template').notNull(), // Parameterized SQL template
  patternDescription: text('pattern_description'),
  
  // Classification
  businessDomain: text('business_domain'), // finance, hr, sales, etc.
  useCases: jsonb('use_cases').default('[]'), // Array of use case descriptions
  
  // Pattern metrics
  usageCount: integer('usage_count').notNull().default(0),
  averagePerformance: decimal('average_performance', { precision: 10, scale: 3 }),
  confidenceLevel: decimal('confidence_level', { precision: 5, scale: 4 }).notNull().default('0.5000'),
  
  // Template parameters
  parameters: jsonb('parameters').notNull().default('[]'),
  // Expected structure:
  // [
  //   { "name": "table_name", "type": "identifier", "required": true },
  //   { "name": "date_range", "type": "date_range", "required": false, "default": "last_30_days" },
  //   { "name": "limit", "type": "integer", "required": false, "default": 100 }
  // ]
  
  // Relations to intelligence
  derivedFrom: jsonb('derived_from').default('[]'), // Array of query_intelligence IDs
  
  // Lifecycle
  isActive: boolean('is_active').notNull().default(true),
  version: integer('version').notNull().default(1),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgIdx: index('qp_org_idx').on(table.organizationId),
  domainIdx: index('qp_domain_idx').on(table.businessDomain),
  usageIdx: index('qp_usage_idx').on(table.usageCount),
  confidenceIdx: index('qp_confidence_idx').on(table.confidenceLevel),
  activeIdx: index('qp_active_idx').on(table.isActive),
}));

// Query feedback - User feedback on query quality
export const queryFeedback = pgTable('query_feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  queryIntelligenceId: uuid('query_intelligence_id').notNull().references(() => queryIntelligence.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  
  // Feedback details
  rating: integer('rating').notNull(), // 1-5 scale
  accuracy: integer('accuracy'), // 1-5 scale (how accurate were the results)
  performance: integer('performance'), // 1-5 scale (how fast was the query)
  relevance: integer('relevance'), // 1-5 scale (how relevant to the user's intent)
  
  // Qualitative feedback
  comments: text('comments'),
  suggestedImprovements: text('suggested_improvements'),
  
  // Context
  sessionContext: jsonb('session_context'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  orgIdx: index('qf_org_idx').on(table.organizationId),
  queryIdx: index('qf_query_idx').on(table.queryIntelligenceId),
  userIdx: index('qf_user_idx').on(table.userId),
  ratingIdx: index('qf_rating_idx').on(table.rating),
}));

// Relations
export const queryIntelligenceRelations = relations(queryIntelligence, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [queryIntelligence.organizationId],
    references: [organizations.id],
  }),
  workspace: one(workspaces, {
    fields: [queryIntelligence.workspaceId],
    references: [workspaces.id],
  }),
  evolutions: many(queryEvolution),
  feedback: many(queryFeedback),
}));

export const queryEvolutionRelations = relations(queryEvolution, ({ one }) => ({
  organization: one(organizations, {
    fields: [queryEvolution.organizationId],
    references: [organizations.id],
  }),
  parentQuery: one(queryIntelligence, {
    fields: [queryEvolution.parentQueryId],
    references: [queryIntelligence.id],
  }),
}));

export const queryBatchJobsRelations = relations(queryBatchJobs, ({ one }) => ({
  organization: one(organizations, {
    fields: [queryBatchJobs.organizationId],
    references: [organizations.id],
  }),
  triggeredBy: one(users, {
    fields: [queryBatchJobs.triggeredBy],
    references: [users.id],
  }),
}));

export const queryPatternsRelations = relations(queryPatterns, ({ one }) => ({
  organization: one(organizations, {
    fields: [queryPatterns.organizationId],
    references: [organizations.id],
  }),
}));

export const queryFeedbackRelations = relations(queryFeedback, ({ one }) => ({
  organization: one(organizations, {
    fields: [queryFeedback.organizationId],
    references: [organizations.id],
  }),
  queryIntelligence: one(queryIntelligence, {
    fields: [queryFeedback.queryIntelligenceId],
    references: [queryIntelligence.id],
  }),
  user: one(users, {
    fields: [queryFeedback.userId],
    references: [users.id],
  }),
}));

// Types
export type QueryIntelligence = InferSelectModel<typeof queryIntelligence>;
export type QueryEvolution = InferSelectModel<typeof queryEvolution>;
export type QueryBatchJob = InferSelectModel<typeof queryBatchJobs>;
export type QueryPattern = InferSelectModel<typeof queryPatterns>;
export type QueryFeedback = InferSelectModel<typeof queryFeedback>;