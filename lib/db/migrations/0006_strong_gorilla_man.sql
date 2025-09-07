DO $$ BEGIN
 CREATE TYPE "public"."reset_frequency" AS ENUM('never', 'yearly', 'monthly', 'quarterly');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."quotation_status" AS ENUM('draft', 'pending', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'converted', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "document_number_sequences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"document_type" "document_type" NOT NULL,
	"current_number" integer DEFAULT 0 NOT NULL,
	"prefix" text DEFAULT '' NOT NULL,
	"suffix" text DEFAULT '' NOT NULL,
	"padding" integer DEFAULT 3 NOT NULL,
	"include_year" boolean DEFAULT true NOT NULL,
	"include_period" boolean DEFAULT false NOT NULL,
	"reset_frequency" "reset_frequency" DEFAULT 'yearly' NOT NULL,
	"last_reset_at" timestamp,
	"sample_format" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"allow_manual_override" boolean DEFAULT true NOT NULL,
	"custom_format" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "generated_document_numbers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"sequence_id" uuid NOT NULL,
	"document_type" "document_type" NOT NULL,
	"generated_number" text NOT NULL,
	"sequence_number" integer NOT NULL,
	"document_id" uuid,
	"is_used" boolean DEFAULT false NOT NULL,
	"used_at" timestamp,
	"generated_for" text,
	"user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quotation_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"product_id" uuid,
	"description" text NOT NULL,
	"sku" text,
	"quantity" numeric(20, 6) NOT NULL,
	"unit_price" numeric(20, 4) NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(20, 2) DEFAULT '0' NOT NULL,
	"line_total" numeric(20, 2) NOT NULL,
	"tax_code_id" uuid,
	"tax_amount" numeric(20, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sales_quotations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid,
	"quotation_number" text NOT NULL,
	"customer_id" uuid NOT NULL,
	"quotation_date" date NOT NULL,
	"valid_until" date NOT NULL,
	"status" "quotation_status" DEFAULT 'draft' NOT NULL,
	"subtotal" numeric(20, 2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(20, 2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(20, 2) DEFAULT '0' NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"total" numeric(20, 2) DEFAULT '0' NOT NULL,
	"payment_terms" text,
	"delivery_terms" text,
	"terms" text,
	"notes" text,
	"internal_notes" text,
	"billing_address" jsonb,
	"shipping_address" jsonb,
	"sent_at" timestamp,
	"viewed_at" timestamp,
	"accepted_at" timestamp,
	"rejected_at" timestamp,
	"converted_at" timestamp,
	"converted_to_order_id" uuid,
	"reference_number" text,
	"customer_po" text,
	"tags" jsonb,
	"custom_fields" jsonb,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "document_number_sequences" ADD CONSTRAINT "document_number_sequences_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "generated_document_numbers" ADD CONSTRAINT "generated_document_numbers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "generated_document_numbers" ADD CONSTRAINT "generated_document_numbers_sequence_id_document_number_sequences_id_fk" FOREIGN KEY ("sequence_id") REFERENCES "public"."document_number_sequences"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotation_lines" ADD CONSTRAINT "quotation_lines_quotation_id_sales_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."sales_quotations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotation_lines" ADD CONSTRAINT "quotation_lines_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotation_lines" ADD CONSTRAINT "quotation_lines_tax_code_id_tax_codes_id_fk" FOREIGN KEY ("tax_code_id") REFERENCES "public"."tax_codes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales_quotations" ADD CONSTRAINT "sales_quotations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales_quotations" ADD CONSTRAINT "sales_quotations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales_quotations" ADD CONSTRAINT "sales_quotations_customer_id_contacts_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales_quotations" ADD CONSTRAINT "sales_quotations_converted_to_order_id_sales_orders_id_fk" FOREIGN KEY ("converted_to_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales_quotations" ADD CONSTRAINT "sales_quotations_created_by_User_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "core_doc_seq_org_type_idx" ON "document_number_sequences" USING btree ("organization_id","document_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "core_doc_seq_active_idx" ON "document_number_sequences" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "core_doc_seq_type_idx" ON "document_number_sequences" USING btree ("document_type");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "core_gen_doc_org_number_idx" ON "generated_document_numbers" USING btree ("organization_id","generated_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "core_gen_doc_sequence_idx" ON "generated_document_numbers" USING btree ("sequence_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "core_gen_doc_document_idx" ON "generated_document_numbers" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "core_gen_doc_used_idx" ON "generated_document_numbers" USING btree ("is_used");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "core_gen_doc_type_idx" ON "generated_document_numbers" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_quotation_line_idx" ON "quotation_lines" USING btree ("quotation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_quotation_line_product_idx" ON "quotation_lines" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_quotation_line_number_idx" ON "quotation_lines" USING btree ("quotation_id","line_number");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "erp_quotation_org_number_idx" ON "sales_quotations" USING btree ("organization_id","quotation_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_quotation_customer_idx" ON "sales_quotations" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_quotation_status_idx" ON "sales_quotations" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erp_quotation_date_idx" ON "sales_quotations" USING btree ("quotation_date");