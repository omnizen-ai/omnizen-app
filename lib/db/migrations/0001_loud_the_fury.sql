DO $$ BEGIN
 CREATE TYPE "public"."accounting_mode" AS ENUM('simple', 'standard', 'strict');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "accounting_mode" "accounting_mode" DEFAULT 'simple' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "enforce_balance_on_post" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "require_approval_workflow" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD COLUMN "total_debits" numeric(20, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD COLUMN "total_credits" numeric(20, 2) DEFAULT '0.00' NOT NULL;