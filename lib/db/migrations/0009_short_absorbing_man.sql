DO $$ BEGIN
 CREATE TYPE "public"."account_type" AS ENUM('asset', 'liability', 'equity', 'revenue', 'expense');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."contact_type" AS ENUM('customer', 'vendor', 'both');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'completed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chart_of_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_number" text NOT NULL,
	"account_name" text NOT NULL,
	"account_type" "account_type" NOT NULL,
	"parent_account_id" uuid,
	"description" text,
	"is_active" boolean DEFAULT true,
	"balance" numeric(20, 2) DEFAULT '0.00',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "chart_of_accounts_account_number_unique" UNIQUE("account_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_type" "contact_type" NOT NULL,
	"company_name" text,
	"first_name" text,
	"last_name" text,
	"email" text,
	"phone" text,
	"address" jsonb,
	"tax_id" text,
	"credit_limit" numeric(20, 2),
	"payment_terms" integer DEFAULT 30,
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expense_date" timestamp NOT NULL,
	"vendor_id" uuid,
	"category_account_id" uuid NOT NULL,
	"payment_account_id" uuid NOT NULL,
	"amount" numeric(20, 2) NOT NULL,
	"tax_amount" numeric(20, 2) DEFAULT '0.00',
	"description" text,
	"receipt_url" text,
	"payment_method" text,
	"reference_number" text,
	"journal_entry_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" text NOT NULL,
	"product_name" text NOT NULL,
	"description" text,
	"category" text,
	"unit_cost" numeric(20, 2) NOT NULL,
	"selling_price" numeric(20, 2) NOT NULL,
	"quantity_on_hand" numeric(20, 4) DEFAULT '0',
	"reorder_point" numeric(20, 4),
	"preferred_vendor_id" uuid,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "inventory_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoice_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"product_id" uuid,
	"description" text NOT NULL,
	"quantity" numeric(20, 4) NOT NULL,
	"unit_price" numeric(20, 2) NOT NULL,
	"discount" numeric(20, 2) DEFAULT '0.00',
	"tax_rate" numeric(5, 2) DEFAULT '0.00',
	"total_amount" numeric(20, 2) NOT NULL,
	"account_id" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" text NOT NULL,
	"contact_id" uuid NOT NULL,
	"invoice_date" timestamp NOT NULL,
	"due_date" timestamp NOT NULL,
	"status" "invoice_status" DEFAULT 'draft',
	"subtotal" numeric(20, 2) NOT NULL,
	"tax_amount" numeric(20, 2) DEFAULT '0.00',
	"total_amount" numeric(20, 2) NOT NULL,
	"paid_amount" numeric(20, 2) DEFAULT '0.00',
	"notes" text,
	"terms" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_number" text NOT NULL,
	"entry_date" timestamp NOT NULL,
	"description" text NOT NULL,
	"reference" text,
	"created_by" text,
	"is_posted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "journal_entries_entry_number_unique" UNIQUE("entry_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "journal_entry_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journal_entry_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"debit" numeric(20, 2) DEFAULT '0.00',
	"credit" numeric(20, 2) DEFAULT '0.00',
	"description" text,
	"contact_id" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_number" text NOT NULL,
	"transaction_date" timestamp NOT NULL,
	"transaction_type" text NOT NULL,
	"contact_id" uuid,
	"account_id" uuid NOT NULL,
	"amount" numeric(20, 2) NOT NULL,
	"payment_method" text,
	"reference_number" text,
	"description" text,
	"status" "transaction_status" DEFAULT 'pending',
	"journal_entry_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "transactions_transaction_number_unique" UNIQUE("transaction_number")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_parent_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("parent_account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "expenses" ADD CONSTRAINT "expenses_vendor_id_contacts_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("category_account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "expenses" ADD CONSTRAINT "expenses_payment_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("payment_account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "expenses" ADD CONSTRAINT "expenses_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inventory" ADD CONSTRAINT "inventory_preferred_vendor_id_contacts_id_fk" FOREIGN KEY ("preferred_vendor_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_product_id_inventory_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."inventory"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "account_number_idx" ON "chart_of_accounts" USING btree ("account_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_type_idx" ON "chart_of_accounts" USING btree ("account_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_type_idx" ON "contacts" USING btree ("contact_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_idx" ON "contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expense_date_idx" ON "expenses" USING btree ("expense_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expense_vendor_idx" ON "expenses" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expense_category_idx" ON "expenses" USING btree ("category_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "sku_idx" ON "inventory" USING btree ("sku");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "category_idx" ON "inventory" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_idx" ON "invoice_line_items" USING btree ("invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "invoice_number_idx" ON "invoices" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_idx" ON "invoices" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "status_idx" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "due_date_idx" ON "invoices" USING btree ("due_date");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "entry_number_idx" ON "journal_entries" USING btree ("entry_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "entry_date_idx" ON "journal_entries" USING btree ("entry_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "journal_entry_idx" ON "journal_entry_lines" USING btree ("journal_entry_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_idx" ON "journal_entry_lines" USING btree ("account_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "transaction_number_idx" ON "transactions" USING btree ("transaction_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transaction_date_idx" ON "transactions" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transaction_contact_idx" ON "transactions" USING btree ("contact_id");