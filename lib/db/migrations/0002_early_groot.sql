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
-- Create semantic schema for AI-optimized views
CREATE SCHEMA IF NOT EXISTS semantic;
COMMENT ON SCHEMA semantic IS 'LLM-optimized views and semantic layer for AI agents';

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
	"account_type" "bank_account_type" NOT NULL,
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
CREATE INDEX IF NOT EXISTS "erp_bank_account_type_idx" ON "bank_accounts" USING btree ("account_type");--> statement-breakpoint
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
CREATE INDEX IF NOT EXISTS "semantic_catalog_org_idx" ON "semantic_catalog" USING btree ("organization_id");