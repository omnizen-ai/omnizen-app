import {
  pgTable,
  text,
  varchar,
  timestamp,
  uuid,
  boolean,
  jsonb,
  index,
  uniqueIndex,
  pgEnum,
  integer,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { organizations, workspaces } from './organizations';

// User roles enum
export const userRoleEnum = pgEnum('user_role', [
  'owner',
  'admin',
  'manager',
  'accountant',
  'employee',
  'viewer',
  'ai_agent'
]);

// Enhanced users table - unified for both chat and ERP
// Replaces the old simple User table with comprehensive fields
export const users = pgTable('User', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Auth fields (compatible with NextAuth)
  email: varchar('email', { length: 64 }).notNull().unique(),
  emailVerified: timestamp('email_verified'),
  password: varchar('password', { length: 64 }), // For credentials provider
  
  // Profile
  name: text('name'),
  image: text('image'),
  displayName: text('display_name'),
  
  // Organization association
  currentOrganizationId: uuid('current_organization_id').references(() => organizations.id),
  currentWorkspaceId: uuid('current_workspace_id').references(() => workspaces.id),
  
  // System fields
  isActive: boolean('is_active').notNull().default(true),
  lastActiveAt: timestamp('last_active_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  
  // Metadata
  preferences: jsonb('preferences').notNull().default({}),
  metadata: jsonb('metadata'),
}, (table) => ({
  emailIdx: uniqueIndex('core_users_email_idx').on(table.email),
  orgIdx: index('core_users_org_idx').on(table.currentOrganizationId),
  activeIdx: index('core_users_active_idx').on(table.isActive),
}));

// Organization memberships - many-to-many
export const organizationMembers = pgTable('organization_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  role: userRoleEnum('role').notNull().default('employee'),
  
  // Permissions can override role defaults
  permissions: jsonb('permissions').notNull().default({}),
  
  // Workspace access (null = all workspaces)
  allowedWorkspaces: jsonb('allowed_workspaces').default(null), // array of workspace IDs or null for all
  
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
  invitedBy: uuid('invited_by').references(() => users.id),
  
  isActive: boolean('is_active').notNull().default(true),
}, (table) => ({
  uniqueMemberIdx: uniqueIndex('core_org_member_unique_idx').on(table.organizationId, table.userId),
  userIdx: index('core_org_member_user_idx').on(table.userId),
  roleIdx: index('core_org_member_role_idx').on(table.role),
}));

// NextAuth specific tables (keeping compatibility)
export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (table) => ({
  uniqueProviderIdx: uniqueIndex('core_provider_unique_idx').on(table.provider, table.providerAccountId),
  userIdx: index('core_accounts_user_idx').on(table.userId),
}));

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionToken: text('session_token').notNull().unique(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
  
  // Additional context
  organizationId: uuid('organization_id').references(() => organizations.id),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
}, (table) => ({
  tokenIdx: uniqueIndex('core_session_token_idx').on(table.sessionToken),
  userIdx: index('core_sessions_user_idx').on(table.userId),
}));

// Audit log for compliance
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  userId: uuid('user_id').references(() => users.id),
  
  action: text('action').notNull(), // create, update, delete, view, execute
  entityType: text('entity_type').notNull(), // invoice, payment, user, etc.
  entityId: uuid('entity_id'),
  
  changes: jsonb('changes'), // before/after for updates
  metadata: jsonb('metadata'), // IP, user agent, etc.
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  orgIdx: index('core_audit_org_idx').on(table.organizationId),
  userIdx: index('core_audit_user_idx').on(table.userId),
  entityIdx: index('core_audit_entity_idx').on(table.entityType, table.entityId),
  createdIdx: index('core_audit_created_idx').on(table.createdAt),
}));

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  currentOrganization: one(organizations, {
    fields: [users.currentOrganizationId],
    references: [organizations.id],
  }),
  currentWorkspace: one(workspaces, {
    fields: [users.currentWorkspaceId],
    references: [workspaces.id],
  }),
  organizationMemberships: many(organizationMembers),
  accounts: many(accounts),
  sessions: many(sessions),
  auditLogs: many(auditLogs),
}));

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationMembers.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [organizationMembers.userId],
    references: [users.id],
  }),
  invitedByUser: one(users, {
    fields: [organizationMembers.invitedBy],
    references: [users.id],
  }),
}));

// Types
export type User = InferSelectModel<typeof users>;
export type OrganizationMember = InferSelectModel<typeof organizationMembers>;
export type Account = InferSelectModel<typeof accounts>;
export type Session = InferSelectModel<typeof sessions>;
export type AuditLog = InferSelectModel<typeof auditLogs>;