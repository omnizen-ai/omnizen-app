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
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { organizations, workspaces } from '../core/organizations';
import { users } from '../core/users';

// Agent types
export const agentTypeEnum = pgEnum('agent_type', [
  'assistant',
  'accountant',
  'analyst',
  'scheduler',
  'customer_service',
  'sales',
  'data_processor',
  'custom'
]);

// Agent status
export const agentStatusEnum = pgEnum('agent_status', [
  'active',
  'paused',
  'disabled',
  'error',
  'configuring'
]);

// LLM models
export const llmModelEnum = pgEnum('llm_model', [
  'gpt-4-turbo',
  'gpt-4',
  'gpt-3.5-turbo',
  'claude-3-opus',
  'claude-3-sonnet',
  'claude-3-haiku',
  'gemini-pro',
  'llama-2-70b',
  'mistral-large',
  'custom'
]);

// AI Agents
export const aiAgents = pgTable('ai_agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  
  // Agent identity
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  type: agentTypeEnum('type').notNull(),
  description: text('description'),
  avatar: text('avatar'), // URL to avatar image
  
  // LLM configuration
  llmModel: llmModelEnum('llm_model').notNull().default('gpt-3.5-turbo'),
  customModelEndpoint: text('custom_model_endpoint'),
  temperature: decimal('temperature', { precision: 3, scale: 2 }).default('0.7'),
  maxTokens: integer('max_tokens').default(2000),
  
  // System prompt and behavior
  systemPrompt: text('system_prompt').notNull(),
  instructions: text('instructions'),
  
  // Capabilities and permissions
  capabilities: jsonb('capabilities').notNull().default([]), // ['read_invoices', 'create_journal_entries', 'send_emails']
  toolsAccess: jsonb('tools_access').notNull().default([]), // ['calculator', 'calendar', 'email', 'database']
  dataAccess: jsonb('data_access').notNull().default({}), // { tables: ['invoices', 'contacts'], operations: ['read'] }
  
  // Restrictions
  maxExecutionsPerDay: integer('max_executions_per_day'),
  maxTokensPerExecution: integer('max_tokens_per_execution'),
  allowedIpAddresses: jsonb('allowed_ip_addresses'),
  
  // Knowledge base
  knowledgeBaseId: uuid('knowledge_base_id'),
  vectorStoreId: text('vector_store_id'), // Supabase Vector store ID
  
  // Configuration
  config: jsonb('config').notNull().default({}),
  webhooks: jsonb('webhooks'), // { onStart: 'url', onComplete: 'url', onError: 'url' }
  
  // Status
  status: agentStatusEnum('status').notNull().default('active'),
  lastActiveAt: timestamp('last_active_at'),
  
  // Metrics
  totalExecutions: integer('total_executions').notNull().default(0),
  successfulExecutions: integer('successful_executions').notNull().default(0),
  failedExecutions: integer('failed_executions').notNull().default(0),
  totalTokensUsed: integer('total_tokens_used').notNull().default(0),
  
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgSlugIdx: uniqueIndex('ai_agent_org_slug_idx').on(table.organizationId, table.slug),
  typeIdx: index('ai_agent_type_idx').on(table.type),
  statusIdx: index('ai_agent_status_idx').on(table.status),
  workspaceIdx: index('ai_agent_workspace_idx').on(table.workspaceId),
}));

// Execution status
export const executionStatusEnum = pgEnum('execution_status', [
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
  'timeout'
]);

// Agent Executions - Track every agent run
export const agentExecutions: any = pgTable('agent_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  agentId: uuid('agent_id').notNull().references(() => aiAgents.id, { onDelete: 'cascade' }),
  
  // Execution context
  executionNumber: text('execution_number').notNull(),
  sessionId: uuid('session_id'), // Group related executions
  parentExecutionId: uuid('parent_execution_id').references((): AnyPgColumn => agentExecutions.id), // For nested agent calls
  
  // Trigger information
  triggeredBy: text('triggered_by').notNull(), // user, schedule, webhook, api, agent
  triggeredById: uuid('triggered_by_id'), // User ID or agent ID
  triggerMetadata: jsonb('trigger_metadata'),
  
  // Task details
  taskType: text('task_type').notNull(), // query, analysis, automation, conversation
  taskDescription: text('task_description'),
  
  // Input/Output
  inputContext: jsonb('input_context').notNull(),
  inputPrompt: text('input_prompt'),
  outputResult: jsonb('output_result'),
  outputSummary: text('output_summary'),
  
  // Execution details
  status: executionStatusEnum('status').notNull().default('pending'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  executionTimeMs: integer('execution_time_ms'),
  
  // Token usage
  promptTokens: integer('prompt_tokens'),
  completionTokens: integer('completion_tokens'),
  totalTokens: integer('total_tokens'),
  estimatedCost: decimal('estimated_cost', { precision: 10, scale: 4 }),
  
  // Tool usage
  toolsUsed: jsonb('tools_used'), // [{ tool: 'calculator', calls: 3 }]
  externalApiCalls: jsonb('external_api_calls'),
  
  // Data access log
  dataAccessed: jsonb('data_accessed'), // [{ table: 'invoices', operation: 'read', records: 10 }]
  dataModified: jsonb('data_modified'), // [{ table: 'journal_entries', operation: 'create', records: 1 }]
  
  // Error handling
  errorMessage: text('error_message'),
  errorDetails: jsonb('error_details'),
  retryCount: integer('retry_count').default(0),
  
  // Feedback
  userRating: integer('user_rating'), // 1-5
  userFeedback: text('user_feedback'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  orgNumberIdx: uniqueIndex('ai_execution_org_number_idx').on(table.organizationId, table.executionNumber),
  agentIdx: index('ai_execution_agent_idx').on(table.agentId),
  sessionIdx: index('ai_execution_session_idx').on(table.sessionId),
  statusIdx: index('ai_execution_status_idx').on(table.status),
  createdIdx: index('ai_execution_created_idx').on(table.createdAt),
}));

// Agent Conversations - Track chat-style interactions
export const agentConversations = pgTable('agent_conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  agentId: uuid('agent_id').notNull().references(() => aiAgents.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  
  // Conversation details
  title: text('title'),
  sessionId: uuid('session_id').notNull(),
  
  // State
  isActive: boolean('is_active').notNull().default(true),
  lastMessageAt: timestamp('last_message_at'),
  messageCount: integer('message_count').notNull().default(0),
  
  // Context
  context: jsonb('context'), // Maintained conversation context
  metadata: jsonb('metadata'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  sessionIdx: uniqueIndex('ai_conversation_session_idx').on(table.sessionId),
  userAgentIdx: index('ai_conversation_user_agent_idx').on(table.userId, table.agentId),
  activeIdx: index('ai_conversation_active_idx').on(table.isActive),
}));

// Conversation Messages
export const conversationMessages = pgTable('conversation_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  conversationId: uuid('conversation_id').notNull().references(() => agentConversations.id, { onDelete: 'cascade' }),
  executionId: uuid('execution_id').references(() => agentExecutions.id),
  
  // Message details
  role: text('role').notNull(), // user, assistant, system, tool
  content: text('content').notNull(),
  
  // Tool calls
  toolCalls: jsonb('tool_calls'),
  toolResults: jsonb('tool_results'),
  
  // Metadata
  metadata: jsonb('metadata'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  conversationIdx: index('ai_message_conversation_idx').on(table.conversationId),
  createdIdx: index('ai_message_created_idx').on(table.createdAt),
}));

// Agent Schedules - For automated runs
export const agentSchedules = pgTable('agent_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  agentId: uuid('agent_id').notNull().references(() => aiAgents.id, { onDelete: 'cascade' }),
  
  // Schedule details
  name: text('name').notNull(),
  description: text('description'),
  
  // Cron expression or interval
  scheduleType: text('schedule_type').notNull(), // cron, interval, event
  cronExpression: text('cron_expression'), // For cron type
  intervalMinutes: integer('interval_minutes'), // For interval type
  eventTrigger: text('event_trigger'), // For event type (e.g., 'invoice.created')
  
  // Task configuration
  taskConfig: jsonb('task_config').notNull(),
  
  // Schedule window
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  
  // Status
  isActive: boolean('is_active').notNull().default(true),
  lastRunAt: timestamp('last_run_at'),
  nextRunAt: timestamp('next_run_at'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  agentIdx: index('ai_schedule_agent_idx').on(table.agentId),
  activeIdx: index('ai_schedule_active_idx').on(table.isActive),
  nextRunIdx: index('ai_schedule_next_run_idx').on(table.nextRunAt),
}));

// Knowledge Base - Store documents and context for agents
export const knowledgeBase: any = pgTable('knowledge_base', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  
  // Document details
  title: text('title').notNull(),
  description: text('description'),
  category: text('category'),
  
  // Content
  content: text('content').notNull(),
  contentType: text('content_type').notNull(), // text, markdown, json, csv
  
  // Metadata
  sourceUrl: text('source_url'),
  sourceType: text('source_type'), // manual, upload, api, scrape
  
  // Vector embedding reference
  embeddingId: text('embedding_id'), // Reference to Supabase Vector
  embeddingModel: text('embedding_model'),
  
  // Access control
  isPublic: boolean('is_public').notNull().default(false),
  allowedAgents: jsonb('allowed_agents'), // Array of agent IDs
  
  // Versioning
  version: integer('version').notNull().default(1),
  previousVersionId: uuid('previous_version_id').references((): AnyPgColumn => knowledgeBase.id),
  
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgIdx: index('ai_kb_org_idx').on(table.organizationId),
  categoryIdx: index('ai_kb_category_idx').on(table.category),
  publicIdx: index('ai_kb_public_idx').on(table.isPublic),
}));

// Relations
export const aiAgentsRelations = relations(aiAgents, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [aiAgents.organizationId],
    references: [organizations.id],
  }),
  workspace: one(workspaces, {
    fields: [aiAgents.workspaceId],
    references: [workspaces.id],
  }),
  createdBy: one(users, {
    fields: [aiAgents.createdBy],
    references: [users.id],
  }),
  executions: many(agentExecutions),
  conversations: many(agentConversations),
  schedules: many(agentSchedules),
}));

export const agentExecutionsRelations = relations(agentExecutions, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [agentExecutions.organizationId],
    references: [organizations.id],
  }),
  agent: one(aiAgents, {
    fields: [agentExecutions.agentId],
    references: [aiAgents.id],
  }),
  parentExecution: one(agentExecutions, {
    fields: [agentExecutions.parentExecutionId],
    references: [agentExecutions.id],
  }),
  childExecutions: many(agentExecutions),
}));

export const agentConversationsRelations = relations(agentConversations, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [agentConversations.organizationId],
    references: [organizations.id],
  }),
  agent: one(aiAgents, {
    fields: [agentConversations.agentId],
    references: [aiAgents.id],
  }),
  user: one(users, {
    fields: [agentConversations.userId],
    references: [users.id],
  }),
  messages: many(conversationMessages),
}));

// Types
export type AIAgent = InferSelectModel<typeof aiAgents>;
export type AgentExecution = InferSelectModel<typeof agentExecutions>;
export type AgentConversation = InferSelectModel<typeof agentConversations>;
export type ConversationMessage = InferSelectModel<typeof conversationMessages>;
export type AgentSchedule = InferSelectModel<typeof agentSchedules>;
export type KnowledgeBase = InferSelectModel<typeof knowledgeBase>;