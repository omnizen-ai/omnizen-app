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
import { organizations } from '../core/organizations';

// Object types in the semantic catalog
export const catalogObjectTypeEnum = pgEnum('catalog_object_type', [
  'table',
  'view',
  'column',
  'function',
  'metric',
  'business_term'
]);

// Semantic Catalog - Maps business terms to database objects
export const semanticCatalog = pgTable('semantic_catalog', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  
  // Object identification
  objectType: catalogObjectTypeEnum('object_type').notNull(),
  objectSchema: text('object_schema').notNull(),
  objectName: text('object_name').notNull(),
  columnName: text('column_name'), // For column-level mappings
  
  // Business metadata
  businessName: text('business_name').notNull(), // User-friendly name
  description: text('description'),
  category: text('category'), // finance, sales, inventory, hr, etc.
  
  // Synonyms and aliases for natural language matching
  aliases: jsonb('aliases'), // ["customer", "client", "buyer", "purchaser"]
  
  // Data classification
  dataType: text('data_type'), // text, number, date, money, percentage
  isPii: boolean('is_pii').notNull().default(false),
  isSensitive: boolean('is_sensitive').notNull().default(false),
  
  // Usage hints for AI
  commonQuestions: jsonb('common_questions'), // Array of example questions
  sqlExamples: jsonb('sql_examples'), // Array of example SQL snippets
  calculationLogic: text('calculation_logic'), // How this metric is calculated
  
  // Relationships
  relatedObjects: jsonb('related_objects'), // Array of related catalog IDs
  
  // Access control hints
  requiredRole: text('required_role'), // Minimum role needed to access
  
  // Metadata
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  objectIdx: index('semantic_catalog_object_idx').on(table.objectSchema, table.objectName),
  categoryIdx: index('semantic_catalog_category_idx').on(table.category),
  businessNameIdx: index('semantic_catalog_business_name_idx').on(table.businessName),
  orgIdx: index('semantic_catalog_org_idx').on(table.organizationId),
}));

// Query templates for common business questions
export const queryTemplates = pgTable('query_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  
  // Template identification
  templateName: text('template_name').notNull(),
  category: text('category').notNull(), // reporting, analysis, monitoring, audit
  
  // Natural language pattern
  questionPattern: text('question_pattern').notNull(), // "What is my {metric} for {period}?"
  questionExamples: jsonb('question_examples'), // Array of example questions
  
  // SQL template
  sqlTemplate: text('sql_template').notNull(), // Parameterized SQL
  parameters: jsonb('parameters').notNull(), // Parameter definitions
  // Example parameters:
  // [
  //   {name: "metric", type: "string", required: true, options: ["revenue", "expenses", "profit"]},
  //   {name: "period", type: "date_range", required: true, default: "this_month"}
  // ]
  
  // Output configuration
  outputFormat: text('output_format').notNull().default('table'), // table, chart, metric, text
  outputColumns: jsonb('output_columns'), // Column definitions for the result
  
  // Validation rules
  validationRules: jsonb('validation_rules'), // Rules to validate parameters
  
  // Performance hints
  estimatedRuntime: text('estimated_runtime'), // fast, medium, slow
  cacheDuration: integer('cache_duration'), // Cache results for N seconds
  
  // Usage tracking
  usageCount: integer('usage_count').notNull().default(0),
  lastUsedAt: timestamp('last_used_at'),
  avgExecutionTime: integer('avg_execution_time'), // milliseconds
  
  // Access control
  requiredRole: text('required_role'),
  allowedUsers: jsonb('allowed_users'), // Array of user IDs
  
  // Metadata
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  categoryIdx: index('query_template_category_idx').on(table.category),
  nameIdx: index('query_template_name_idx').on(table.templateName),
  orgIdx: index('query_template_org_idx').on(table.organizationId),
}));

// Business metrics definitions
export const businessMetrics = pgTable('business_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  
  // Metric identification
  metricCode: text('metric_code').notNull(), // REVENUE_MTD, CASH_RUNWAY, DSO
  metricName: text('metric_name').notNull(),
  category: text('category').notNull(), // financial, operational, sales, customer
  
  // Calculation
  calculationType: text('calculation_type').notNull(), // sql, formula, aggregation
  sqlQuery: text('sql_query'), // For SQL-based metrics
  formula: text('formula'), // For formula-based metrics (e.g., "revenue - expenses")
  
  // Aggregation settings
  aggregationMethod: text('aggregation_method'), // sum, avg, count, min, max
  groupByFields: jsonb('group_by_fields'), // Fields to group by
  
  // Time settings
  timeDimension: text('time_dimension'), // daily, weekly, monthly, quarterly, yearly
  rollingWindow: integer('rolling_window'), // Number of periods for rolling metrics
  
  // Thresholds and targets
  targetValue: decimal('target_value', { precision: 20, scale: 2 }),
  warningThreshold: decimal('warning_threshold', { precision: 20, scale: 2 }),
  criticalThreshold: decimal('critical_threshold', { precision: 20, scale: 2 }),
  
  // Display settings
  displayFormat: text('display_format'), // number, currency, percentage
  decimalPlaces: integer('decimal_places').default(2),
  prefix: text('prefix'), // $, €, £
  suffix: text('suffix'), // %, days, units
  
  // Description and help
  description: text('description'),
  businessContext: text('business_context'), // Why this metric matters
  improvementTips: jsonb('improvement_tips'), // Array of suggestions
  
  // Dependencies
  dependsOn: jsonb('depends_on'), // Array of other metric IDs
  
  // Metadata
  isKpi: boolean('is_kpi').notNull().default(false), // Is this a key performance indicator?
  isActive: boolean('is_active').notNull().default(true),
  refreshFrequency: text('refresh_frequency'), // realtime, hourly, daily, weekly
  lastCalculatedAt: timestamp('last_calculated_at'),
  lastCalculatedValue: decimal('last_calculated_value', { precision: 20, scale: 2 }),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgCodeIdx: uniqueIndex('business_metric_org_code_idx').on(table.organizationId, table.metricCode),
  categoryIdx: index('business_metric_category_idx').on(table.category),
  kpiIdx: index('business_metric_kpi_idx').on(table.isKpi),
}));

// Natural language mappings for common business terms
export const nlMappings = pgTable('nl_mappings', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  
  // Mapping details
  naturalPhrase: text('natural_phrase').notNull(), // "outstanding invoices"
  mappingType: text('mapping_type').notNull(), // filter, metric, entity, action
  
  // SQL mapping
  sqlFragment: text('sql_fragment').notNull(), // "status IN ('sent', 'viewed', 'partially_paid')"
  targetTable: text('target_table'), // invoices
  targetColumn: text('target_column'), // status
  
  // Context and conditions
  contextRequired: jsonb('context_required'), // Required context for this mapping
  conditions: jsonb('conditions'), // Additional conditions
  
  // Priority and scoring
  priority: integer('priority').notNull().default(100), // Lower number = higher priority
  confidenceScore: decimal('confidence_score', { precision: 3, scale: 2 }).default('1.00'),
  
  // Usage tracking
  usageCount: integer('usage_count').notNull().default(0),
  successRate: decimal('success_rate', { precision: 5, scale: 2 }),
  
  // Examples
  exampleQueries: jsonb('example_queries'), // Array of example natural language queries
  
  // Metadata
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  phraseIdx: index('nl_mapping_phrase_idx').on(table.naturalPhrase),
  typeIdx: index('nl_mapping_type_idx').on(table.mappingType),
  orgIdx: index('nl_mapping_org_idx').on(table.organizationId),
}));

// PII field registry for compliance
export const piiFieldRegistry = pgTable('pii_field_registry', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Field identification
  schemaName: text('schema_name').notNull(),
  tableName: text('table_name').notNull(),
  columnName: text('column_name').notNull(),
  
  // PII classification
  piiType: text('pii_type').notNull(), // email, phone, ssn, credit_card, address, name
  sensitivityLevel: text('sensitivity_level').notNull(), // low, medium, high, critical
  
  // Compliance
  regulations: jsonb('regulations'), // ["GDPR", "CCPA", "HIPAA"]
  retentionDays: integer('retention_days'),
  
  // Access control
  allowedRoles: jsonb('allowed_roles'), // Roles that can access this field
  requiresAudit: boolean('requires_audit').notNull().default(true),
  requiresEncryption: boolean('requires_encryption').notNull().default(false),
  
  // Masking rules
  maskingEnabled: boolean('masking_enabled').notNull().default(true),
  maskingPattern: text('masking_pattern'), // e.g., "***-**-{last4}" for SSN
  
  // Notes
  notes: text('notes'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  fieldIdx: uniqueIndex('pii_field_idx').on(table.schemaName, table.tableName, table.columnName),
  typeIdx: index('pii_type_idx').on(table.piiType),
  sensitivityIdx: index('pii_sensitivity_idx').on(table.sensitivityLevel),
}));

// Relations
export const semanticCatalogRelations = relations(semanticCatalog, ({ one }) => ({
  organization: one(organizations, {
    fields: [semanticCatalog.organizationId],
    references: [organizations.id],
  }),
}));

export const queryTemplatesRelations = relations(queryTemplates, ({ one }) => ({
  organization: one(organizations, {
    fields: [queryTemplates.organizationId],
    references: [organizations.id],
  }),
}));

export const businessMetricsRelations = relations(businessMetrics, ({ one }) => ({
  organization: one(organizations, {
    fields: [businessMetrics.organizationId],
    references: [organizations.id],
  }),
}));

export const nlMappingsRelations = relations(nlMappings, ({ one }) => ({
  organization: one(organizations, {
    fields: [nlMappings.organizationId],
    references: [organizations.id],
  }),
}));

// Types
export type SemanticCatalog = InferSelectModel<typeof semanticCatalog>;
export type QueryTemplate = InferSelectModel<typeof queryTemplates>;
export type BusinessMetric = InferSelectModel<typeof businessMetrics>;
export type NLMapping = InferSelectModel<typeof nlMappings>;
export type PIIFieldRegistry = InferSelectModel<typeof piiFieldRegistry>;