ALTER TABLE "organizations" ADD COLUMN "base_currency" text DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD COLUMN "foreign_debit" numeric(20, 2);--> statement-breakpoint
ALTER TABLE "journal_lines" ADD COLUMN "foreign_credit" numeric(20, 2);