DO $$ BEGIN
 CREATE TYPE "public"."organization_type" AS ENUM('business', 'personal', 'hybrid');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."plan_tier" AS ENUM('starter', 'professional', 'enterprise', 'custom', 'personal-free', 'personal-plus', 'personal-pro', 'family');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."user_role" AS ENUM('owner', 'admin', 'manager', 'accountant', 'employee', 'viewer', 'ai_agent');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."account_type" AS ENUM('asset', 'liability', 'equity', 'income', 'expense', 'contra_asset', 'contra_liability', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."entry_status" AS ENUM('draft', 'pending_approval', 'approved', 'posted', 'void', 'reversed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."journal_type" AS ENUM('general', 'sales', 'purchases', 'cash_receipts', 'cash_disbursements', 'inventory', 'payroll', 'adjusting', 'closing', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."bill_status" AS ENUM('draft', 'received', 'approved', 'partially_paid', 'paid', 'overdue', 'disputed', 'cancelled', 'void');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."contact_type" AS ENUM('customer', 'vendor', 'customer_vendor', 'employee', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'cancelled', 'void');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."payment_method" AS ENUM('cash', 'check', 'credit_card', 'debit_card', 'bank_transfer', 'ach', 'wire', 'paypal', 'stripe', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."agent_status" AS ENUM('active', 'paused', 'disabled', 'error', 'configuring');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."agent_type" AS ENUM('assistant', 'accountant', 'analyst', 'scheduler', 'customer_service', 'sales', 'data_processor', 'custom');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."execution_status" AS ENUM('pending', 'running', 'completed', 'failed', 'cancelled', 'timeout');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."llm_model" AS ENUM('gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku', 'gemini-pro', 'llama-2-70b', 'mistral-large', 'custom');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."automation_trigger" AS ENUM('schedule', 'event', 'webhook', 'threshold', 'condition', 'manual');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."erp_operation" AS ENUM('read', 'create', 'update', 'delete', 'approve', 'post', 'void', 'reconcile', 'export');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."permission_scope" AS ENUM('global', 'workspace', 'entity', 'record', 'field');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."bank_account_type" AS ENUM('checking', 'savings', 'credit_card', 'cash', 'loan', 'merchant', 'investment');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."bank_transaction_type" AS ENUM('deposit', 'withdrawal', 'transfer', 'fee', 'interest', 'adjustment', 'opening_balance');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."reconciliation_status" AS ENUM('draft', 'in_progress', 'completed', 'approved', 'void');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."fulfillment_status" AS ENUM('pending', 'picking', 'packing', 'ready_to_ship', 'shipped', 'in_transit', 'delivered', 'returned', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."purchase_order_status" AS ENUM('draft', 'pending_approval', 'approved', 'sent', 'acknowledged', 'partially_received', 'received', 'partially_billed', 'billed', 'completed', 'cancelled', 'on_hold');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."sales_order_status" AS ENUM('draft', 'pending', 'confirmed', 'in_fulfillment', 'partially_fulfilled', 'fulfilled', 'partially_invoiced', 'invoiced', 'completed', 'cancelled', 'on_hold');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."adjustment_reason" AS ENUM('cycle_count', 'physical_inventory', 'damaged', 'expired', 'lost', 'found', 'theft', 'data_correction', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."stock_move_type" AS ENUM('purchase', 'sale', 'transfer', 'adjustment', 'production', 'return', 'damage', 'count');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."warehouse_type" AS ENUM('main', 'branch', 'retail', 'distribution', 'virtual', 'consignment', 'third_party');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."catalog_object_type" AS ENUM('table', 'view', 'column', 'function', 'metric', 'business_term');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."asset_type" AS ENUM('stock', 'etf', 'mutual_fund', 'bond', 'crypto', 'commodity');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."budget_period" AS ENUM('weekly', 'monthly', 'quarterly', 'yearly');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."goal_status" AS ENUM('active', 'paused', 'completed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."goal_type" AS ENUM('savings', 'debt_payoff', 'investment', 'purchase', 'emergency_fund', 'retirement');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."subscription_frequency" AS ENUM('weekly', 'monthly', 'quarterly', 'annual');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Chat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp NOT NULL,
	"title" text NOT NULL,
	"userId" uuid NOT NULL,
	"visibility" varchar DEFAULT 'private' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Document" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"text" varchar DEFAULT 'text' NOT NULL,
	"userId" uuid NOT NULL,
	CONSTRAINT "Document_id_createdAt_pk" PRIMARY KEY("id","createdAt")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Message_v2" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chatId" uuid NOT NULL,
	"role" varchar NOT NULL,
	"parts" json NOT NULL,
	"attachments" json NOT NULL,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chatId" uuid NOT NULL,
	"role" varchar NOT NULL,
	"content" json NOT NULL,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Stream" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"chatId" uuid NOT NULL,
	"createdAt" timestamp NOT NULL,
	CONSTRAINT "Stream_id_pk" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Suggestion" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"documentId" uuid NOT NULL,
	"documentCreatedAt" timestamp NOT NULL,
	"originalText" text NOT NULL,
	"suggestedText" text NOT NULL,
	"description" text,
	"isResolved" boolean DEFAULT false NOT NULL,
	"userId" uuid NOT NULL,
	"createdAt" timestamp NOT NULL,
	CONSTRAINT "Suggestion_id_pk" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "User" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(64) NOT NULL,
	"email_verified" timestamp,
	"password" varchar(64),
	"name" text,
	"image" text,
	"display_name" text,
	"current_organization_id" uuid,
	"current_workspace_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_active_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "User_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Vote_v2" (
	"chatId" uuid NOT NULL,
	"messageId" uuid NOT NULL,
	"isUpvoted" boolean NOT NULL,
	CONSTRAINT "Vote_v2_chatId_messageId_pk" PRIMARY KEY("chatId","messageId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Vote" (
	"chatId" uuid NOT NULL,
	"messageId" uuid NOT NULL,
	"isUpvoted" boolean NOT NULL,
	CONSTRAINT "Vote_chatId_messageId_pk" PRIMARY KEY("chatId","messageId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"plan_tier" "plan_tier" DEFAULT 'starter' NOT NULL,
	"organization_type" "organization_type" DEFAULT 'business',
	"is_personal_finance" boolean DEFAULT false,
	"feature_flags" jsonb DEFAULT '{"invoicing":true,"basic_accounting":true,"full_accounting":false,"inventory":false,"ai_automation":false,"custom_workflows":false,"api_access":false,"white_label":false}'::jsonb NOT NULL,
	"max_users" integer DEFAULT 5 NOT NULL,
	"max_ai_agents" integer DEFAULT 2 NOT NULL,
	"max_workspaces" integer DEFAULT 1 NOT NULL,
	"data_retention_days" integer DEFAULT 90 NOT NULL,
	"country_code" text DEFAULT 'US',
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"fiscal_year_start" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"trial_ends_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"workspace_type" text DEFAULT 'default' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb,
	"parent_workspace_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid,
	"user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"changes" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "user_role" DEFAULT 'employee' NOT NULL,
	"permissions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"allowed_workspaces" jsonb DEFAULT 'null'::jsonb,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"invited_by" uuid,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_token" text NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp NOT NULL,
	"organization_id" uuid,
	"workspace_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chart_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"type" "account_type" NOT NULL,
	"parent_id" uuid,
	"description" text,
	"is_postable" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_system_account" boolean DEFAULT false NOT NULL,
	"currency_code" text DEFAULT 'USD' NOT NULL,
	"normal_balance" text NOT NULL,
	"current_balance" numeric(20, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "currencies" (
	"code" text PRIMARY KEY NOT NULL,
	"symbol" text NOT NULL,
	"name" text NOT NULL,
	"decimals" integer DEFAULT 2 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exchange_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"rate_date" timestamp NOT NULL,
	"from_currency" text NOT NULL,
	"to_currency" text NOT NULL,
	"rate" numeric(20, 8) NOT NULL,
	"source" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid,
	"journal_id" uuid NOT NULL,
	"entry_number" text NOT NULL,
	"entry_date" timestamp NOT NULL,
	"document_type" text,
	"document_id" uuid,
	"description" text NOT NULL,
	"memo" text,
	"status" "entry_status" DEFAULT 'draft' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"posted_at" timestamp,
	"reversed_from_id" uuid,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "journal_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"journal_entry_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"account_id" uuid NOT NULL,
	"debit" numeric(20, 2) DEFAULT '0.00' NOT NULL,
	"credit" numeric(20, 2) DEFAULT '0.00' NOT NULL,
	"currency_code" text DEFAULT 'USD' NOT NULL,
	"exchange_rate" numeric(20, 8),
	"contact_id" uuid,
	"product_id" uuid,
	"tax_code_id" uuid,
	"description" text,
	"department_id" uuid,
	"project_id" uuid,
	"cost_center_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "journals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"type" "journal_type" NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tax_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"rate_percent" numeric(9, 4) DEFAULT '0' NOT NULL,
	"is_sales" boolean DEFAULT true NOT NULL,
	"is_purchase" boolean DEFAULT true NOT NULL,
	"sales_account_id" uuid,
	"purchase_account_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bill_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bill_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"product_id" uuid,
	"description" text NOT NULL,
	"quantity" numeric(20, 6) NOT NULL,
	"unit_price" numeric(20, 6) NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0',
	"discount_amount" numeric(20, 2) DEFAULT '0',
	"tax_code_id" uuid,
	"tax_rate" numeric(5, 2) DEFAULT '0',
	"tax_amount" numeric(20, 2) DEFAULT '0',
	"line_subtotal" numeric(20, 2) NOT NULL,
	"line_total" numeric(20, 2) NOT NULL,
	"account_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid,
	"bill_number" text NOT NULL,
	"vendor_id" uuid NOT NULL,
	"vendor_invoice_number" text,
	"bill_date" timestamp NOT NULL,
	"due_date" timestamp NOT NULL,
	"currency_code" text DEFAULT 'USD' NOT NULL,
	"exchange_rate" numeric(20, 8),
	"subtotal" numeric(20, 2) NOT NULL,
	"discount_amount" numeric(20, 2) DEFAULT '0',
	"tax_amount" numeric(20, 2) DEFAULT '0',
	"total_amount" numeric(20, 2) NOT NULL,
	"paid_amount" numeric(20, 2) DEFAULT '0',
	"balance_due" numeric(20, 2) NOT NULL,
	"status" "bill_status" DEFAULT 'draft' NOT NULL,
	"po_number" text,
	"journal_entry_id" uuid,
	"approved_by" uuid,
	"approved_at" timestamp,
	"notes" text,
	"custom_fields" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid,
	"type" "contact_type" NOT NULL,
	"external_code" text,
	"company_name" text,
	"first_name" text,
	"last_name" text,
	"display_name" text,
	"email" text,
	"phone" text,
	"mobile" text,
	"website" text,
	"address_line1" text,
	"address_line2" text,
	"city" text,
	"state" text,
	"postal_code" text,
	"country" text,
	"tax_id" text,
	"currency_code" text DEFAULT 'USD' NOT NULL,
	"payment_terms" integer DEFAULT 30,
	"credit_limit" numeric(20, 2),
	"default_sales_account_id" uuid,
	"default_purchase_account_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"custom_fields" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoice_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"product_id" uuid,
	"description" text NOT NULL,
	"quantity" numeric(20, 6) NOT NULL,
	"unit_price" numeric(20, 6) NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0',
	"discount_amount" numeric(20, 2) DEFAULT '0',
	"tax_code_id" uuid,
	"tax_rate" numeric(5, 2) DEFAULT '0',
	"tax_amount" numeric(20, 2) DEFAULT '0',
	"line_subtotal" numeric(20, 2) NOT NULL,
	"line_total" numeric(20, 2) NOT NULL,
	"account_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid,
	"invoice_number" text NOT NULL,
	"customer_id" uuid NOT NULL,
	"issue_date" timestamp NOT NULL,
	"due_date" timestamp NOT NULL,
	"currency_code" text DEFAULT 'USD' NOT NULL,
	"exchange_rate" numeric(20, 8),
	"subtotal" numeric(20, 2) NOT NULL,
	"discount_amount" numeric(20, 2) DEFAULT '0',
	"tax_amount" numeric(20, 2) DEFAULT '0',
	"total_amount" numeric(20, 2) NOT NULL,
	"paid_amount" numeric(20, 2) DEFAULT '0',
	"balance_due" numeric(20, 2) NOT NULL,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"po_number" text,
	"journal_entry_id" uuid,
	"notes" text,
	"terms" text,
	"footer" text,
	"sent_at" timestamp,
	"viewed_at" timestamp,
	"paid_at" timestamp,
	"custom_fields" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"document_type" text NOT NULL,
	"document_id" uuid NOT NULL,
	"amount_applied" numeric(20, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid,
	"payment_number" text NOT NULL,
	"payment_date" timestamp NOT NULL,
	"direction" text NOT NULL,
	"contact_id" uuid NOT NULL,
	"amount" numeric(20, 2) NOT NULL,
	"currency_code" text DEFAULT 'USD' NOT NULL,
	"exchange_rate" numeric(20, 8),
	"method" "payment_method" NOT NULL,
	"reference_number" text,
	"bank_account_id" uuid,
	"status" text DEFAULT 'posted' NOT NULL,
	"journal_entry_id" uuid,
	"memo" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_service" boolean DEFAULT false NOT NULL,
	"category" text,
	"unit_of_measure" text DEFAULT 'unit' NOT NULL,
	"sale_price" numeric(20, 6),
	"purchase_price" numeric(20, 6),
	"currency_code" text DEFAULT 'USD' NOT NULL,
	"tax_code_id" uuid,
	"is_taxable" boolean DEFAULT true NOT NULL,
	"income_account_id" uuid,
	"expense_account_id" uuid,
	"inventory_account_id" uuid,
	"is_tracked_inventory" boolean DEFAULT false NOT NULL,
	"quantity_on_hand" numeric(20, 4) DEFAULT '0',
	"reorder_point" numeric(20, 4),
	"reorder_quantity" numeric(20, 4),
	"preferred_vendor_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"custom_fields" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agent_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text,
	"session_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_message_at" timestamp,
	"message_count" integer DEFAULT 0 NOT NULL,
	"context" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agent_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"execution_number" text NOT NULL,
	"session_id" uuid,
	"parent_execution_id" uuid,
	"triggered_by" text NOT NULL,
	"triggered_by_id" uuid,
	"trigger_metadata" jsonb,
	"task_type" text NOT NULL,
	"task_description" text,
	"input_context" jsonb NOT NULL,
	"input_prompt" text,
	"output_result" jsonb,
	"output_summary" text,
	"status" "execution_status" DEFAULT 'pending' NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"execution_time_ms" integer,
	"prompt_tokens" integer,
	"completion_tokens" integer,
	"total_tokens" integer,
	"estimated_cost" numeric(10, 4),
	"tools_used" jsonb,
	"external_api_calls" jsonb,
	"data_accessed" jsonb,
	"data_modified" jsonb,
	"error_message" text,
	"error_details" jsonb,
	"retry_count" integer DEFAULT 0,
	"user_rating" integer,
	"user_feedback" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agent_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"schedule_type" text NOT NULL,
	"cron_expression" text,
	"interval_minutes" integer,
	"event_trigger" text,
	"task_config" jsonb NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp,
	"next_run_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"type" "agent_type" NOT NULL,
	"description" text,
	"avatar" text,
	"llm_model" "llm_model" DEFAULT 'gpt-3.5-turbo' NOT NULL,
	"custom_model_endpoint" text,
	"temperature" numeric(3, 2) DEFAULT '0.7',
	"max_tokens" integer DEFAULT 2000,
	"system_prompt" text NOT NULL,
	"instructions" text,
	"capabilities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tools_access" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"data_access" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"max_executions_per_day" integer,
	"max_tokens_per_execution" integer,
	"allowed_ip_addresses" jsonb,
	"knowledge_base_id" uuid,
	"vector_store_id" text,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"webhooks" jsonb,
	"status" "agent_status" DEFAULT 'active' NOT NULL,
	"last_active_at" timestamp,
	"total_executions" integer DEFAULT 0 NOT NULL,
	"successful_executions" integer DEFAULT 0 NOT NULL,
	"failed_executions" integer DEFAULT 0 NOT NULL,
	"total_tokens_used" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversation_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"execution_id" uuid,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"tool_calls" jsonb,
	"tool_results" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "knowledge_base" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text,
	"content" text NOT NULL,
	"content_type" text NOT NULL,
	"source_url" text,
	"source_type" text,
	"embedding_id" text,
	"embedding_model" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"allowed_agents" jsonb,
	"version" integer DEFAULT 1 NOT NULL,
	"previous_version_id" uuid,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agent_audit_trail" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"agent_id" uuid,
	"execution_id" uuid,
	"action_type" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"action" text NOT NULL,
	"sql_query" text,
	"previous_data" jsonb,
	"new_data" jsonb,
	"changed_fields" jsonb,
	"financial_impact" numeric(20, 2),
	"affected_accounts" jsonb,
	"reason" text,
	"business_context" jsonb,
	"ip_address" text,
	"user_agent" text,
	"session_id" text,
	"risk_level" text,
	"risk_factors" jsonb,
	"required_approval" boolean DEFAULT false NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"approval_notes" text,
	"status" text NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agent_erp_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"permission_name" text NOT NULL,
	"description" text,
	"scope" "permission_scope" NOT NULL,
	"entity_types" jsonb,
	"operations" jsonb,
	"conditions" jsonb,
	"allowed_fields" jsonb,
	"denied_fields" jsonb,
	"max_transaction_amount" numeric(20, 2),
	"max_daily_volume" numeric(20, 2),
	"max_records_per_query" integer,
	"allowed_hours" jsonb,
	"allowed_days" jsonb,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"approval_threshold" numeric(20, 2),
	"approver_roles" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"valid_from" timestamp,
	"valid_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "erp_automation_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"agent_id" uuid,
	"rule_name" text NOT NULL,
	"description" text,
	"category" text,
	"trigger_type" "automation_trigger" NOT NULL,
	"trigger_config" jsonb NOT NULL,
	"conditions" jsonb,
	"actions" jsonb NOT NULL,
	"max_executions_per_day" integer,
	"cooldown_minutes" integer,
	"retry_on_failure" boolean DEFAULT true NOT NULL,
	"max_retries" integer DEFAULT 3,
	"notify_on_success" boolean DEFAULT false NOT NULL,
	"notify_on_failure" boolean DEFAULT true NOT NULL,
	"notification_emails" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_executed_at" timestamp,
	"last_status" text,
	"execution_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "financial_guardrails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"guardrail_name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"entity_type" text,
	"rules" jsonb NOT NULL,
	"allow_override" boolean DEFAULT false NOT NULL,
	"override_roles" jsonb,
	"override_requires_reason" boolean DEFAULT true NOT NULL,
	"notify_on_violation" boolean DEFAULT true NOT NULL,
	"notification_recipients" jsonb,
	"violation_count" integer DEFAULT 0 NOT NULL,
	"last_violation_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "query_validation_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"rule_name" text NOT NULL,
	"description" text,
	"rule_type" text NOT NULL,
	"sql_patterns" jsonb,
	"blocked_keywords" jsonb,
	"blocked_tables" jsonb,
	"blocked_columns" jsonb,
	"max_joins" integer,
	"max_subqueries" integer,
	"max_rows_returned" integer,
	"max_execution_time" integer,
	"required_clauses" jsonb,
	"action" text NOT NULL,
	"warning_message" text,
	"exempt_agents" jsonb,
	"exempt_users" jsonb,
	"priority" integer DEFAULT 100 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid,
	"account_name" text NOT NULL,
	"account_number" text,
	"bank_account_type" "bank_account_type" NOT NULL,
	"bank_name" text,
	"bank_branch" text,
	"routing_number" text,
	"swift_code" text,
	"iban" text,
	"currency_code" text NOT NULL,
	"gl_account_id" uuid NOT NULL,
	"current_balance" numeric(20, 2) DEFAULT '0' NOT NULL,
	"available_balance" numeric(20, 2) DEFAULT '0' NOT NULL,
	"last_reconciled_balance" numeric(20, 2) DEFAULT '0',
	"last_reconciled_date" date,
	"is_default" boolean DEFAULT false NOT NULL,
	"allow_payments" boolean DEFAULT true NOT NULL,
	"allow_deposits" boolean DEFAULT true NOT NULL,
	"require_reconciliation" boolean DEFAULT true NOT NULL,
	"bank_feed_enabled" boolean DEFAULT false NOT NULL,
	"bank_feed_provider" text,
	"bank_feed_credentials" jsonb,
	"last_synced_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bank_reconciliations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"statement_date" date NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"statement_beginning_balance" numeric(20, 2) NOT NULL,
	"statement_ending_balance" numeric(20, 2) NOT NULL,
	"gl_beginning_balance" numeric(20, 2) NOT NULL,
	"gl_ending_balance" numeric(20, 2) NOT NULL,
	"cleared_deposits" numeric(20, 2) DEFAULT '0' NOT NULL,
	"cleared_withdrawals" numeric(20, 2) DEFAULT '0' NOT NULL,
	"outstanding_deposits" numeric(20, 2) DEFAULT '0' NOT NULL,
	"outstanding_withdrawals" numeric(20, 2) DEFAULT '0' NOT NULL,
	"adjustments" numeric(20, 2) DEFAULT '0' NOT NULL,
	"difference" numeric(20, 2) DEFAULT '0' NOT NULL,
	"status" "reconciliation_status" DEFAULT 'draft' NOT NULL,
	"prepared_by" uuid,
	"prepared_at" timestamp,
	"approved_by" uuid,
	"approved_at" timestamp,
	"notes" text,
	"cleared_transaction_ids" jsonb,
	"outstanding_transaction_ids" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bank_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"rule_name" text NOT NULL,
	"description" text,
	"conditions" jsonb NOT NULL,
	"actions" jsonb NOT NULL,
	"bank_account_ids" jsonb,
	"priority" numeric(10, 0) DEFAULT '100' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"stop_on_match" boolean DEFAULT false NOT NULL,
	"match_count" numeric(10, 0) DEFAULT '0' NOT NULL,
	"last_matched_at" timestamp,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bank_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"transaction_date" date NOT NULL,
	"transaction_type" "bank_transaction_type" NOT NULL,
	"bank_reference_number" text,
	"check_number" text,
	"amount" numeric(20, 2) NOT NULL,
	"running_balance" numeric(20, 2),
	"payee" text,
	"description" text,
	"memo" text,
	"category" text,
	"tags" jsonb,
	"is_reconciled" boolean DEFAULT false NOT NULL,
	"reconciled_date" date,
	"reconciliation_id" uuid,
	"payment_id" uuid,
	"journal_entry_id" uuid,
	"import_batch_id" text,
	"is_duplicate" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cash_flow_forecasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"forecast_name" text NOT NULL,
	"description" text,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"scenario" text DEFAULT 'base' NOT NULL,
	"starting_balance" numeric(20, 2) NOT NULL,
	"forecast_items" jsonb NOT NULL,
	"total_inflows" numeric(20, 2) DEFAULT '0' NOT NULL,
	"total_outflows" numeric(20, 2) DEFAULT '0' NOT NULL,
	"ending_balance" numeric(20, 2) DEFAULT '0' NOT NULL,
	"minimum_balance" numeric(20, 2),
	"minimum_balance_date" date,
	"include_weekends" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fulfillment_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fulfillment_id" uuid NOT NULL,
	"sales_order_line_id" uuid NOT NULL,
	"quantity_fulfilled" numeric(20, 6) NOT NULL,
	"lot_number" text,
	"serial_numbers" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_fulfillments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"sales_order_id" uuid NOT NULL,
	"fulfillment_number" text NOT NULL,
	"fulfillment_date" timestamp NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"shipping_method" text,
	"shipping_carrier" text,
	"tracking_number" text,
	"shipping_cost" numeric(20, 2),
	"status" "fulfillment_status" DEFAULT 'pending' NOT NULL,
	"shipped_at" timestamp,
	"delivered_at" timestamp,
	"notes" text,
	"created_by" uuid,
	"fulfilled_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "purchase_order_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"product_id" uuid,
	"description" text NOT NULL,
	"vendor_sku" text,
	"quantity_ordered" numeric(20, 6) NOT NULL,
	"quantity_received" numeric(20, 6) DEFAULT '0' NOT NULL,
	"quantity_billed" numeric(20, 6) DEFAULT '0' NOT NULL,
	"quantity_cancelled" numeric(20, 6) DEFAULT '0' NOT NULL,
	"unit_price" numeric(20, 6) NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0',
	"discount_amount" numeric(20, 2) DEFAULT '0',
	"tax_code_id" uuid,
	"tax_rate" numeric(5, 2) DEFAULT '0',
	"tax_amount" numeric(20, 2) DEFAULT '0',
	"line_subtotal" numeric(20, 2) NOT NULL,
	"line_total" numeric(20, 2) NOT NULL,
	"expected_receipt_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "purchase_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid,
	"order_number" text NOT NULL,
	"vendor_id" uuid NOT NULL,
	"order_date" date NOT NULL,
	"expected_receipt_date" date,
	"actual_receipt_date" date,
	"ship_to_warehouse_id" uuid,
	"ship_to_address_line1" text,
	"ship_to_address_line2" text,
	"ship_to_city" text,
	"ship_to_state" text,
	"ship_to_postal_code" text,
	"ship_to_country" text,
	"currency_code" text DEFAULT 'USD' NOT NULL,
	"exchange_rate" numeric(20, 8),
	"subtotal" numeric(20, 2) NOT NULL,
	"discount_amount" numeric(20, 2) DEFAULT '0',
	"shipping_amount" numeric(20, 2) DEFAULT '0',
	"tax_amount" numeric(20, 2) DEFAULT '0',
	"total_amount" numeric(20, 2) NOT NULL,
	"total_quantity_ordered" numeric(20, 6) DEFAULT '0' NOT NULL,
	"total_quantity_received" numeric(20, 6) DEFAULT '0' NOT NULL,
	"total_quantity_billed" numeric(20, 6) DEFAULT '0' NOT NULL,
	"status" "purchase_order_status" DEFAULT 'draft' NOT NULL,
	"vendor_reference_number" text,
	"requisition_number" text,
	"payment_terms" integer DEFAULT 30,
	"requested_by" uuid,
	"approved_by" uuid,
	"approved_at" timestamp,
	"approval_notes" text,
	"sent_at" timestamp,
	"sent_method" text,
	"internal_notes" text,
	"vendor_notes" text,
	"custom_fields" jsonb,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "purchase_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"receipt_number" text NOT NULL,
	"receipt_date" timestamp NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"vendor_delivery_note" text,
	"status" text DEFAULT 'received' NOT NULL,
	"quality_check_required" boolean DEFAULT false NOT NULL,
	"quality_check_completed" boolean DEFAULT false NOT NULL,
	"quality_check_notes" text,
	"notes" text,
	"received_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "receipt_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"receipt_id" uuid NOT NULL,
	"purchase_order_line_id" uuid NOT NULL,
	"quantity_received" numeric(20, 6) NOT NULL,
	"quantity_accepted" numeric(20, 6) NOT NULL,
	"quantity_rejected" numeric(20, 6) DEFAULT '0' NOT NULL,
	"rejection_reason" text,
	"lot_number" text,
	"serial_numbers" jsonb,
	"expiry_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sales_order_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sales_order_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"product_id" uuid,
	"description" text NOT NULL,
	"quantity_ordered" numeric(20, 6) NOT NULL,
	"quantity_fulfilled" numeric(20, 6) DEFAULT '0' NOT NULL,
	"quantity_invoiced" numeric(20, 6) DEFAULT '0' NOT NULL,
	"quantity_cancelled" numeric(20, 6) DEFAULT '0' NOT NULL,
	"unit_price" numeric(20, 6) NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0',
	"discount_amount" numeric(20, 2) DEFAULT '0',
	"tax_code_id" uuid,
	"tax_rate" numeric(5, 2) DEFAULT '0',
	"tax_amount" numeric(20, 2) DEFAULT '0',
	"line_subtotal" numeric(20, 2) NOT NULL,
	"line_total" numeric(20, 2) NOT NULL,
	"expected_delivery_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sales_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid,
	"order_number" text NOT NULL,
	"customer_id" uuid NOT NULL,
	"order_date" date NOT NULL,
	"expected_delivery_date" date,
	"actual_delivery_date" date,
	"shipping_address_line1" text,
	"shipping_address_line2" text,
	"shipping_city" text,
	"shipping_state" text,
	"shipping_postal_code" text,
	"shipping_country" text,
	"billing_address_line1" text,
	"billing_address_line2" text,
	"billing_city" text,
	"billing_state" text,
	"billing_postal_code" text,
	"billing_country" text,
	"warehouse_id" uuid,
	"currency_code" text DEFAULT 'USD' NOT NULL,
	"exchange_rate" numeric(20, 8),
	"subtotal" numeric(20, 2) NOT NULL,
	"discount_amount" numeric(20, 2) DEFAULT '0',
	"shipping_amount" numeric(20, 2) DEFAULT '0',
	"tax_amount" numeric(20, 2) DEFAULT '0',
	"total_amount" numeric(20, 2) NOT NULL,
	"total_quantity_ordered" numeric(20, 6) DEFAULT '0' NOT NULL,
	"total_quantity_fulfilled" numeric(20, 6) DEFAULT '0' NOT NULL,
	"total_quantity_invoiced" numeric(20, 6) DEFAULT '0' NOT NULL,
	"status" "sales_order_status" DEFAULT 'draft' NOT NULL,
	"customer_po_number" text,
	"sales_rep_id" uuid,
	"payment_terms" integer DEFAULT 30,
	"internal_notes" text,
	"customer_notes" text,
	"custom_fields" jsonb,
	"approved_by" uuid,
	"approved_at" timestamp,
	"fulfilled_by" uuid,
	"fulfilled_at" timestamp,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "inventory_adjustment_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"adjustment_id" uuid NOT NULL,
	"line_number" numeric(10, 0) NOT NULL,
	"product_id" uuid NOT NULL,
	"current_quantity" numeric(20, 6) NOT NULL,
	"new_quantity" numeric(20, 6) NOT NULL,
	"adjustment_quantity" numeric(20, 6) NOT NULL,
	"unit_cost" numeric(20, 6),
	"total_value_change" numeric(20, 2),
	"lot_number" text,
	"serial_number" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "inventory_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"adjustment_number" text NOT NULL,
	"adjustment_date" timestamp NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"reason" "adjustment_reason" NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"requested_by" uuid,
	"approved_by" uuid,
	"approved_at" timestamp,
	"posted_at" timestamp,
	"stock_move_ids" jsonb,
	"total_items" numeric(10, 0) DEFAULT '0' NOT NULL,
	"total_value_change" numeric(20, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "inventory_levels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"quantity_on_hand" numeric(20, 6) DEFAULT '0' NOT NULL,
	"quantity_reserved" numeric(20, 6) DEFAULT '0' NOT NULL,
	"quantity_available" numeric(20, 6) DEFAULT '0' NOT NULL,
	"reorder_point" numeric(20, 6),
	"reorder_quantity" numeric(20, 6),
	"max_stock_level" numeric(20, 6),
	"average_cost" numeric(20, 6),
	"last_purchase_cost" numeric(20, 6),
	"total_value" numeric(20, 2),
	"last_received_date" timestamp,
	"last_sold_date" timestamp,
	"last_counted_date" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stock_moves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"move_number" text NOT NULL,
	"move_date" timestamp NOT NULL,
	"move_type" "stock_move_type" NOT NULL,
	"product_id" uuid NOT NULL,
	"from_warehouse_id" uuid,
	"to_warehouse_id" uuid,
	"quantity" numeric(20, 6) NOT NULL,
	"unit_cost" numeric(20, 6),
	"total_cost" numeric(20, 2),
	"reference_type" text,
	"reference_id" uuid,
	"reason" text,
	"notes" text,
	"lot_number" text,
	"serial_number" text,
	"expiry_date" timestamp,
	"status" text DEFAULT 'completed' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "warehouses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"type" "warehouse_type" DEFAULT 'main' NOT NULL,
	"address_line1" text,
	"address_line2" text,
	"city" text,
	"state" text,
	"postal_code" text,
	"country" text,
	"manager_name" text,
	"phone" text,
	"email" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"allow_negative_stock" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"custom_fields" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "business_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"metric_code" text NOT NULL,
	"metric_name" text NOT NULL,
	"category" text NOT NULL,
	"calculation_type" text NOT NULL,
	"sql_query" text,
	"formula" text,
	"aggregation_method" text,
	"group_by_fields" jsonb,
	"time_dimension" text,
	"rolling_window" integer,
	"target_value" numeric(20, 2),
	"warning_threshold" numeric(20, 2),
	"critical_threshold" numeric(20, 2),
	"display_format" text,
	"decimal_places" integer DEFAULT 2,
	"prefix" text,
	"suffix" text,
	"description" text,
	"business_context" text,
	"improvement_tips" jsonb,
	"depends_on" jsonb,
	"is_kpi" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"refresh_frequency" text,
	"last_calculated_at" timestamp,
	"last_calculated_value" numeric(20, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nl_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"natural_phrase" text NOT NULL,
	"mapping_type" text NOT NULL,
	"sql_fragment" text NOT NULL,
	"target_table" text,
	"target_column" text,
	"context_required" jsonb,
	"conditions" jsonb,
	"priority" integer DEFAULT 100 NOT NULL,
	"confidence_score" numeric(3, 2) DEFAULT '1.00',
	"usage_count" integer DEFAULT 0 NOT NULL,
	"success_rate" numeric(5, 2),
	"example_queries" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pii_field_registry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schema_name" text NOT NULL,
	"table_name" text NOT NULL,
	"column_name" text NOT NULL,
	"pii_type" text NOT NULL,
	"sensitivity_level" text NOT NULL,
	"regulations" jsonb,
	"retention_days" integer,
	"allowed_roles" jsonb,
	"requires_audit" boolean DEFAULT true NOT NULL,
	"requires_encryption" boolean DEFAULT false NOT NULL,
	"masking_enabled" boolean DEFAULT true NOT NULL,
	"masking_pattern" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "query_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"template_name" text NOT NULL,
	"category" text NOT NULL,
	"question_pattern" text NOT NULL,
	"question_examples" jsonb,
	"sql_template" text NOT NULL,
	"parameters" jsonb NOT NULL,
	"output_format" text DEFAULT 'table' NOT NULL,
	"output_columns" jsonb,
	"validation_rules" jsonb,
	"estimated_runtime" text,
	"cache_duration" integer,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp,
	"avg_execution_time" integer,
	"required_role" text,
	"allowed_users" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "semantic_catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"object_type" "catalog_object_type" NOT NULL,
	"object_schema" text NOT NULL,
	"object_name" text NOT NULL,
	"column_name" text,
	"business_name" text NOT NULL,
	"description" text,
	"category" text,
	"aliases" jsonb,
	"data_type" text,
	"is_pii" boolean DEFAULT false NOT NULL,
	"is_sensitive" boolean DEFAULT false NOT NULL,
	"common_questions" jsonb,
	"sql_examples" jsonb,
	"calculation_logic" text,
	"related_objects" jsonb,
	"required_role" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "budget_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"category_id" uuid,
	"period" "budget_period" DEFAULT 'monthly',
	"budget_amount" numeric(15, 2) NOT NULL,
	"alert_threshold" numeric(5, 2) DEFAULT '80.00',
	"rollover" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "financial_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"goal_type" "goal_type" NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"target_amount" numeric(15, 2) NOT NULL,
	"current_amount" numeric(15, 2) DEFAULT '0',
	"target_date" date,
	"priority" integer DEFAULT 1,
	"auto_allocate" boolean DEFAULT false,
	"allocation_amount" numeric(15, 2),
	"allocation_frequency" varchar(20),
	"status" "goal_status" DEFAULT 'active',
	"completed_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "investment_holdings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"name" varchar(200) NOT NULL,
	"asset_type" "asset_type",
	"quantity" numeric(15, 8) NOT NULL,
	"cost_basis" numeric(15, 2) NOT NULL,
	"current_price" numeric(15, 4),
	"market_value" numeric(15, 2),
	"unrealized_gain_loss" numeric(15, 2),
	"last_updated" timestamp DEFAULT now(),
	"investment_account_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "personal_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"icon" varchar(50),
	"color" varchar(7),
	"typical_merchants" text[],
	"tax_relevant" boolean DEFAULT false,
	"parent_category_id" uuid,
	"default_account_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "personal_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"vendor_name" varchar(200),
	"category_id" uuid,
	"amount" numeric(15, 2) NOT NULL,
	"frequency" "subscription_frequency",
	"next_billing_date" date,
	"is_active" boolean DEFAULT true,
	"cancellation_url" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Chat" ADD CONSTRAINT "Chat_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Message_v2" ADD CONSTRAINT "Message_v2_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Stream" ADD CONSTRAINT "Stream_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_documentId_documentCreatedAt_Document_id_createdAt_fk" FOREIGN KEY ("documentId","documentCreatedAt") REFERENCES "public"."Document"("id","createdAt") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "User" ADD CONSTRAINT "User_current_organization_id_organizations_id_fk" FOREIGN KEY ("current_organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "User" ADD CONSTRAINT "User_current_workspace_id_workspaces_id_fk" FOREIGN KEY ("current_workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Vote_v2" ADD CONSTRAINT "Vote_v2_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Vote_v2" ADD CONSTRAINT "Vote_v2_messageId_Message_v2_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."Message_v2"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Vote" ADD CONSTRAINT "Vote_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Vote" ADD CONSTRAINT "Vote_messageId_Message_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_parent_workspace_id_workspaces_id_fk" FOREIGN KEY ("parent_workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_invited_by_User_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chart_accounts" ADD CONSTRAINT "chart_accounts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chart_accounts" ADD CONSTRAINT "chart_accounts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chart_accounts" ADD CONSTRAINT "chart_accounts_parent_id_chart_accounts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."chart_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_from_currency_currencies_code_fk" FOREIGN KEY ("from_currency") REFERENCES "public"."currencies"("code") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_to_currency_currencies_code_fk" FOREIGN KEY ("to_currency") REFERENCES "public"."currencies"("code") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_journal_id_journals_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."journals"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_reversed_from_id_journal_entries_id_fk" FOREIGN KEY ("reversed_from_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_account_id_chart_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."chart_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "journals" ADD CONSTRAINT "journals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "journals" ADD CONSTRAINT "journals_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tax_codes" ADD CONSTRAINT "tax_codes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tax_codes" ADD CONSTRAINT "tax_codes_sales_account_id_chart_accounts_id_fk" FOREIGN KEY ("sales_account_id") REFERENCES "public"."chart_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tax_codes" ADD CONSTRAINT "tax_codes_purchase_account_id_chart_accounts_id_fk" FOREIGN KEY ("purchase_account_id") REFERENCES "public"."chart_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bill_lines" ADD CONSTRAINT "bill_lines_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bill_lines" ADD CONSTRAINT "bill_lines_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bill_lines" ADD CONSTRAINT "bill_lines_account_id_chart_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."chart_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bills" ADD CONSTRAINT "bills_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bills" ADD CONSTRAINT "bills_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bills" ADD CONSTRAINT "bills_vendor_id_contacts_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bills" ADD CONSTRAINT "bills_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contacts" ADD CONSTRAINT "contacts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contacts" ADD CONSTRAINT "contacts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contacts" ADD CONSTRAINT "contacts_default_sales_account_id_chart_accounts_id_fk" FOREIGN KEY ("default_sales_account_id") REFERENCES "public"."chart_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contacts" ADD CONSTRAINT "contacts_default_purchase_account_id_chart_accounts_id_fk" FOREIGN KEY ("default_purchase_account_id") REFERENCES "public"."chart_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_account_id_chart_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."chart_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_contacts_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_bank_account_id_chart_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."chart_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_income_account_id_chart_accounts_id_fk" FOREIGN KEY ("income_account_id") REFERENCES "public"."chart_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_expense_account_id_chart_accounts_id_fk" FOREIGN KEY ("expense_account_id") REFERENCES "public"."chart_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_inventory_account_id_chart_accounts_id_fk" FOREIGN KEY ("inventory_account_id") REFERENCES "public"."chart_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_preferred_vendor_id_contacts_id_fk" FOREIGN KEY ("preferred_vendor_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_conversations" ADD CONSTRAINT "agent_conversations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_conversations" ADD CONSTRAINT "agent_conversations_agent_id_ai_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."ai_agents"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_conversations" ADD CONSTRAINT "agent_conversations_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_executions" ADD CONSTRAINT "agent_executions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_executions" ADD CONSTRAINT "agent_executions_agent_id_ai_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."ai_agents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_executions" ADD CONSTRAINT "agent_executions_parent_execution_id_agent_executions_id_fk" FOREIGN KEY ("parent_execution_id") REFERENCES "public"."agent_executions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_schedules" ADD CONSTRAINT "agent_schedules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_schedules" ADD CONSTRAINT "agent_schedules_agent_id_ai_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."ai_agents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_agents" ADD CONSTRAINT "ai_agents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_agents" ADD CONSTRAINT "ai_agents_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_agents" ADD CONSTRAINT "ai_agents_created_by_User_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_agent_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."agent_conversations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_execution_id_agent_executions_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."agent_executions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_previous_version_id_knowledge_base_id_fk" FOREIGN KEY ("previous_version_id") REFERENCES "public"."knowledge_base"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_created_by_User_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_audit_trail" ADD CONSTRAINT "agent_audit_trail_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_audit_trail" ADD CONSTRAINT "agent_audit_trail_agent_id_ai_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."ai_agents"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_audit_trail" ADD CONSTRAINT "agent_audit_trail_approved_by_User_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_erp_permissions" ADD CONSTRAINT "agent_erp_permissions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_erp_permissions" ADD CONSTRAINT "agent_erp_permissions_agent_id_ai_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."ai_agents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "erp_automation_rules" ADD CONSTRAINT "erp_automation_rules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "erp_automation_rules" ADD CONSTRAINT "erp_automation_rules_agent_id_ai_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."ai_agents"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "erp_automation_rules" ADD CONSTRAINT "erp_automation_rules_created_by_User_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "financial_guardrails" ADD CONSTRAINT "financial_guardrails_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "query_validation_rules" ADD CONSTRAINT "query_validation_rules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_currency_code_currencies_code_fk" FOREIGN KEY ("currency_code") REFERENCES "public"."currencies"("code") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_gl_account_id_chart_accounts_id_fk" FOREIGN KEY ("gl_account_id") REFERENCES "public"."chart_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_reconciliations" ADD CONSTRAINT "bank_reconciliations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_reconciliations" ADD CONSTRAINT "bank_reconciliations_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_reconciliations" ADD CONSTRAINT "bank_reconciliations_prepared_by_User_id_fk" FOREIGN KEY ("prepared_by") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_reconciliations" ADD CONSTRAINT "bank_reconciliations_approved_by_User_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_rules" ADD CONSTRAINT "bank_rules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_rules" ADD CONSTRAINT "bank_rules_created_by_User_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_reconciliation_id_bank_reconciliations_id_fk" FOREIGN KEY ("reconciliation_id") REFERENCES "public"."bank_reconciliations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cash_flow_forecasts" ADD CONSTRAINT "cash_flow_forecasts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cash_flow_forecasts" ADD CONSTRAINT "cash_flow_forecasts_created_by_User_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fulfillment_lines" ADD CONSTRAINT "fulfillment_lines_fulfillment_id_order_fulfillments_id_fk" FOREIGN KEY ("fulfillment_id") REFERENCES "public"."order_fulfillments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fulfillment_lines" ADD CONSTRAINT "fulfillment_lines_sales_order_line_id_sales_order_lines_id_fk" FOREIGN KEY ("sales_order_line_id") REFERENCES "public"."sales_order_lines"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_fulfillments" ADD CONSTRAINT "order_fulfillments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_fulfillments" ADD CONSTRAINT "order_fulfillments_sales_order_id_sales_orders_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_fulfillments" ADD CONSTRAINT "order_fulfillments_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_fulfillments" ADD CONSTRAINT "order_fulfillments_created_by_User_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_fulfillments" ADD CONSTRAINT "order_fulfillments_fulfilled_by_User_id_fk" FOREIGN KEY ("fulfilled_by") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_tax_code_id_tax_codes_id_fk" FOREIGN KEY ("tax_code_id") REFERENCES "public"."tax_codes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_vendor_id_contacts_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_ship_to_warehouse_id_warehouses_id_fk" FOREIGN KEY ("ship_to_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_requested_by_User_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_approved_by_User_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_created_by_User_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "purchase_receipts" ADD CONSTRAINT "purchase_receipts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "purchase_receipts" ADD CONSTRAINT "purchase_receipts_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "purchase_receipts" ADD CONSTRAINT "purchase_receipts_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "purchase_receipts" ADD CONSTRAINT "purchase_receipts_received_by_User_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "receipt_lines" ADD CONSTRAINT "receipt_lines_receipt_id_purchase_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."purchase_receipts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "receipt_lines" ADD CONSTRAINT "receipt_lines_purchase_order_line_id_purchase_order_lines_id_fk" FOREIGN KEY ("purchase_order_line_id") REFERENCES "public"."purchase_order_lines"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales_order_lines" ADD CONSTRAINT "sales_order_lines_sales_order_id_sales_orders_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales_order_lines" ADD CONSTRAINT "sales_order_lines_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales_order_lines" ADD CONSTRAINT "sales_order_lines_tax_code_id_tax_codes_id_fk" FOREIGN KEY ("tax_code_id") REFERENCES "public"."tax_codes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_customer_id_contacts_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_sales_rep_id_User_id_fk" FOREIGN KEY ("sales_rep_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_approved_by_User_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_fulfilled_by_User_id_fk" FOREIGN KEY ("fulfilled_by") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_created_by_User_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inventory_adjustment_lines" ADD CONSTRAINT "inventory_adjustment_lines_adjustment_id_inventory_adjustments_id_fk" FOREIGN KEY ("adjustment_id") REFERENCES "public"."inventory_adjustments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inventory_adjustment_lines" ADD CONSTRAINT "inventory_adjustment_lines_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_requested_by_User_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_approved_by_User_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inventory_levels" ADD CONSTRAINT "inventory_levels_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inventory_levels" ADD CONSTRAINT "inventory_levels_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inventory_levels" ADD CONSTRAINT "inventory_levels_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_from_warehouse_id_warehouses_id_fk" FOREIGN KEY ("from_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_to_warehouse_id_warehouses_id_fk" FOREIGN KEY ("to_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_created_by_User_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "business_metrics" ADD CONSTRAINT "business_metrics_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nl_mappings" ADD CONSTRAINT "nl_mappings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "query_templates" ADD CONSTRAINT "query_templates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "semantic_catalog" ADD CONSTRAINT "semantic_catalog_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "budget_rules" ADD CONSTRAINT "budget_rules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "budget_rules" ADD CONSTRAINT "budget_rules_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "budget_rules" ADD CONSTRAINT "budget_rules_category_id_personal_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."personal_categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "financial_goals" ADD CONSTRAINT "financial_goals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "financial_goals" ADD CONSTRAINT "financial_goals_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "investment_holdings" ADD CONSTRAINT "investment_holdings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "investment_holdings" ADD CONSTRAINT "investment_holdings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "investment_holdings" ADD CONSTRAINT "investment_holdings_investment_account_id_chart_accounts_id_fk" FOREIGN KEY ("investment_account_id") REFERENCES "public"."chart_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "personal_categories" ADD CONSTRAINT "personal_categories_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "personal_categories" ADD CONSTRAINT "personal_categories_parent_category_id_personal_categories_id_fk" FOREIGN KEY ("parent_category_id") REFERENCES "public"."personal_categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "personal_categories" ADD CONSTRAINT "personal_categories_default_account_id_chart_accounts_id_fk" FOREIGN KEY ("default_account_id") REFERENCES "public"."chart_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "personal_subscriptions" ADD CONSTRAINT "personal_subscriptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "personal_subscriptions" ADD CONSTRAINT "personal_subscriptions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "personal_subscriptions" ADD CONSTRAINT "personal_subscriptions_category_id_personal_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."personal_categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "core_users_email_idx" ON "User" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "core_users_org_idx" ON "User" USING btree ("current_organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "core_users_active_idx" ON "User" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "core_org_slug_idx" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "core_org_plan_tier_idx" ON "organizations" USING btree ("plan_tier");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "core_org_active_idx" ON "organizations" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "core_org_workspace_idx" ON "workspaces" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "core_workspace_type_idx" ON "workspaces" USING btree ("workspace_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "core_audit_org_idx" ON "audit_logs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "core_audit_user_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "core_audit_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "core_audit_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "core_provider_unique_idx" ON "auth_accounts" USING btree ("provider","provider_account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "core_accounts_user_idx" ON "auth_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "core_org_member_unique_idx" ON "organization_members" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "core_org_member_user_idx" ON "organization_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "core_org_member_role_idx" ON "organization_members" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "core_session_token_idx" ON "sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "core_sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "fin_account_org_code_idx" ON "chart_accounts" USING btree ("organization_id","code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fin_account_type_idx" ON "chart_accounts" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fin_account_parent_idx" ON "chart_accounts" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fin_account_active_idx" ON "chart_accounts" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "fin_fx_rate_unique_idx" ON "exchange_rates" USING btree ("organization_id","rate_date","from_currency","to_currency");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "fin_entry_org_number_idx" ON "journal_entries" USING btree ("organization_id","entry_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fin_entry_date_idx" ON "journal_entries" USING btree ("entry_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fin_entry_status_idx" ON "journal_entries" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fin_entry_document_idx" ON "journal_entries" USING btree ("document_type","document_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "fin_journal_line_entry_idx" ON "journal_lines" USING btree ("journal_entry_id","line_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fin_journal_line_account_idx" ON "journal_lines" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fin_journal_line_contact_idx" ON "journal_lines" USING btree ("contact_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "fin_journal_org_code_idx" ON "journals" USING btree ("organization_id","code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fin_journal_type_idx" ON "journals" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "fin_tax_code_org_idx" ON "tax_codes" USING btree ("organization_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "fin_bill_line_idx" ON "bill_lines" USING btree ("bill_id","line_number");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "fin_bill_org_number_idx" ON "bills" USING btree ("organization_id","bill_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fin_bill_vendor_idx" ON "bills" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fin_bill_status_idx" ON "bills" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fin_bill_due_date_idx" ON "bills" USING btree ("due_date");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "fin_contact_org_external_idx" ON "contacts" USING btree ("organization_id","external_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fin_contact_type_idx" ON "contacts" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fin_contact_email_idx" ON "contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fin_contact_active_idx" ON "contacts" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "fin_invoice_line_idx" ON "invoice_lines" USING btree ("invoice_id","line_number");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "fin_invoice_org_number_idx" ON "invoices" USING btree ("organization_id","invoice_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fin_invoice_customer_idx" ON "invoices" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fin_invoice_status_idx" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fin_invoice_due_date_idx" ON "invoices" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fin_allocation_payment_idx" ON "payment_allocations" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fin_allocation_document_idx" ON "payment_allocations" USING btree ("document_type","document_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "fin_payment_org_number_idx" ON "payments" USING btree ("organization_id","payment_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fin_payment_contact_idx" ON "payments" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fin_payment_date_idx" ON "payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fin_payment_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "fin_product_org_sku_idx" ON "products" USING btree ("organization_id","sku");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fin_product_category_idx" ON "products" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fin_product_active_idx" ON "products" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ai_conversation_session_idx" ON "agent_conversations" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_conversation_user_agent_idx" ON "agent_conversations" USING btree ("user_id","agent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_conversation_active_idx" ON "agent_conversations" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ai_execution_org_number_idx" ON "agent_executions" USING btree ("organization_id","execution_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_execution_agent_idx" ON "agent_executions" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_execution_session_idx" ON "agent_executions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_execution_status_idx" ON "agent_executions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_execution_created_idx" ON "agent_executions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_schedule_agent_idx" ON "agent_schedules" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_schedule_active_idx" ON "agent_schedules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_schedule_next_run_idx" ON "agent_schedules" USING btree ("next_run_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ai_agent_org_slug_idx" ON "ai_agents" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_agent_type_idx" ON "ai_agents" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_agent_status_idx" ON "ai_agents" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_agent_workspace_idx" ON "ai_agents" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_message_conversation_idx" ON "conversation_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_message_created_idx" ON "conversation_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_kb_org_idx" ON "knowledge_base" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_kb_category_idx" ON "knowledge_base" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_kb_public_idx" ON "knowledge_base" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_audit_agent_idx" ON "agent_audit_trail" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_audit_entity_idx" ON "agent_audit_trail" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_audit_action_idx" ON "agent_audit_trail" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_audit_created_idx" ON "agent_audit_trail" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_audit_risk_idx" ON "agent_audit_trail" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_erp_perm_agent_idx" ON "agent_erp_permissions" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_erp_perm_scope_idx" ON "agent_erp_permissions" USING btree ("scope");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_erp_perm_active_idx" ON "agent_erp_permissions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_automation_trigger_idx" ON "erp_automation_rules" USING btree ("trigger_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_automation_category_idx" ON "erp_automation_rules" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_automation_active_idx" ON "erp_automation_rules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_automation_agent_idx" ON "erp_automation_rules" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "financial_guardrail_category_idx" ON "financial_guardrails" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "financial_guardrail_entity_idx" ON "financial_guardrails" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "financial_guardrail_active_idx" ON "financial_guardrails" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "query_validation_type_idx" ON "query_validation_rules" USING btree ("rule_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "query_validation_priority_idx" ON "query_validation_rules" USING btree ("priority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "query_validation_active_idx" ON "query_validation_rules" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "erp_bank_account_org_name_idx" ON "bank_accounts" USING btree ("organization_id","account_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_bank_account_type_idx" ON "bank_accounts" USING btree ("bank_account_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_bank_account_gl_idx" ON "bank_accounts" USING btree ("gl_account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_bank_account_active_idx" ON "bank_accounts" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "erp_recon_account_date_idx" ON "bank_reconciliations" USING btree ("bank_account_id","statement_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_recon_status_idx" ON "bank_reconciliations" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_bank_rule_priority_idx" ON "bank_rules" USING btree ("priority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_bank_rule_active_idx" ON "bank_rules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_bank_txn_account_date_idx" ON "bank_transactions" USING btree ("bank_account_id","transaction_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_bank_txn_reconciled_idx" ON "bank_transactions" USING btree ("is_reconciled");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_bank_txn_payment_idx" ON "bank_transactions" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_bank_txn_import_idx" ON "bank_transactions" USING btree ("import_batch_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_cash_forecast_date_idx" ON "cash_flow_forecasts" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_cash_forecast_scenario_idx" ON "cash_flow_forecasts" USING btree ("scenario");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_cash_forecast_active_idx" ON "cash_flow_forecasts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_fulfillment_line_idx" ON "fulfillment_lines" USING btree ("fulfillment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_fulfillment_line_so_idx" ON "fulfillment_lines" USING btree ("sales_order_line_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "erp_fulfillment_org_number_idx" ON "order_fulfillments" USING btree ("organization_id","fulfillment_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_fulfillment_so_idx" ON "order_fulfillments" USING btree ("sales_order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_fulfillment_status_idx" ON "order_fulfillments" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_fulfillment_warehouse_idx" ON "order_fulfillments" USING btree ("warehouse_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "erp_po_line_idx" ON "purchase_order_lines" USING btree ("purchase_order_id","line_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_po_line_product_idx" ON "purchase_order_lines" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "erp_po_org_number_idx" ON "purchase_orders" USING btree ("organization_id","order_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_po_vendor_idx" ON "purchase_orders" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_po_status_idx" ON "purchase_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_po_date_idx" ON "purchase_orders" USING btree ("order_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_po_warehouse_idx" ON "purchase_orders" USING btree ("ship_to_warehouse_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "erp_receipt_org_number_idx" ON "purchase_receipts" USING btree ("organization_id","receipt_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_receipt_po_idx" ON "purchase_receipts" USING btree ("purchase_order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_receipt_warehouse_idx" ON "purchase_receipts" USING btree ("warehouse_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_receipt_line_idx" ON "receipt_lines" USING btree ("receipt_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_receipt_line_po_idx" ON "receipt_lines" USING btree ("purchase_order_line_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "erp_so_line_idx" ON "sales_order_lines" USING btree ("sales_order_id","line_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_so_line_product_idx" ON "sales_order_lines" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "erp_so_org_number_idx" ON "sales_orders" USING btree ("organization_id","order_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_so_customer_idx" ON "sales_orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_so_status_idx" ON "sales_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_so_date_idx" ON "sales_orders" USING btree ("order_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_so_warehouse_idx" ON "sales_orders" USING btree ("warehouse_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "erp_adj_line_idx" ON "inventory_adjustment_lines" USING btree ("adjustment_id","line_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_adj_line_product_idx" ON "inventory_adjustment_lines" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "erp_adjustment_org_number_idx" ON "inventory_adjustments" USING btree ("organization_id","adjustment_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_adjustment_warehouse_idx" ON "inventory_adjustments" USING btree ("warehouse_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_adjustment_status_idx" ON "inventory_adjustments" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_adjustment_date_idx" ON "inventory_adjustments" USING btree ("adjustment_date");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "erp_inventory_unique_idx" ON "inventory_levels" USING btree ("organization_id","product_id","warehouse_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_inventory_warehouse_idx" ON "inventory_levels" USING btree ("warehouse_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_inventory_product_idx" ON "inventory_levels" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "erp_stock_move_org_number_idx" ON "stock_moves" USING btree ("organization_id","move_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_stock_move_product_idx" ON "stock_moves" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_stock_move_warehouse_idx" ON "stock_moves" USING btree ("from_warehouse_id","to_warehouse_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_stock_move_date_idx" ON "stock_moves" USING btree ("move_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_stock_move_type_idx" ON "stock_moves" USING btree ("move_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_stock_move_reference_idx" ON "stock_moves" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "erp_warehouse_org_code_idx" ON "warehouses" USING btree ("organization_id","code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_warehouse_type_idx" ON "warehouses" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_warehouse_active_idx" ON "warehouses" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "business_metric_org_code_idx" ON "business_metrics" USING btree ("organization_id","metric_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "business_metric_category_idx" ON "business_metrics" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "business_metric_kpi_idx" ON "business_metrics" USING btree ("is_kpi");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "nl_mapping_phrase_idx" ON "nl_mappings" USING btree ("natural_phrase");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "nl_mapping_type_idx" ON "nl_mappings" USING btree ("mapping_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "nl_mapping_org_idx" ON "nl_mappings" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pii_field_idx" ON "pii_field_registry" USING btree ("schema_name","table_name","column_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pii_type_idx" ON "pii_field_registry" USING btree ("pii_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pii_sensitivity_idx" ON "pii_field_registry" USING btree ("sensitivity_level");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "query_template_category_idx" ON "query_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "query_template_name_idx" ON "query_templates" USING btree ("template_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "query_template_org_idx" ON "query_templates" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "semantic_catalog_object_idx" ON "semantic_catalog" USING btree ("object_schema","object_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "semantic_catalog_category_idx" ON "semantic_catalog" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "semantic_catalog_business_name_idx" ON "semantic_catalog" USING btree ("business_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "semantic_catalog_org_idx" ON "semantic_catalog" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "personal_budget_org_workspace_idx" ON "budget_rules" USING btree ("organization_id","workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "personal_budget_category_idx" ON "budget_rules" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "personal_budget_active_idx" ON "budget_rules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "personal_goal_org_workspace_idx" ON "financial_goals" USING btree ("organization_id","workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "personal_goal_type_idx" ON "financial_goals" USING btree ("goal_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "personal_goal_status_idx" ON "financial_goals" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "personal_invest_org_workspace_idx" ON "investment_holdings" USING btree ("organization_id","workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "personal_invest_symbol_idx" ON "investment_holdings" USING btree ("symbol");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "personal_invest_type_idx" ON "investment_holdings" USING btree ("asset_type");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "personal_cat_org_name_idx" ON "personal_categories" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "personal_cat_parent_idx" ON "personal_categories" USING btree ("parent_category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "personal_cat_tax_idx" ON "personal_categories" USING btree ("tax_relevant");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "personal_sub_org_workspace_idx" ON "personal_subscriptions" USING btree ("organization_id","workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "personal_sub_active_idx" ON "personal_subscriptions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "personal_sub_billing_idx" ON "personal_subscriptions" USING btree ("next_billing_date");