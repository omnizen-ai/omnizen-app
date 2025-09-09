DO $$ BEGIN
 CREATE TYPE "public"."document_numbering_type" AS ENUM('invoice', 'bill', 'payment', 'journal_entry', 'sales_order', 'purchase_order', 'quotation', 'fulfillment', 'receipt', 'stock_move', 'adjustment', 'bank_transaction', 'forecast');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "document_type" ADD VALUE 'audio';--> statement-breakpoint
ALTER TYPE "document_type" ADD VALUE 'video';--> statement-breakpoint
ALTER TABLE "document_number_sequences" ALTER COLUMN "document_type" SET DATA TYPE document_numbering_type;--> statement-breakpoint
ALTER TABLE "generated_document_numbers" ALTER COLUMN "document_type" SET DATA TYPE document_numbering_type;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "transcript" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "transcript_segments" jsonb;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "audio_duration" real;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "transcription_confidence" real;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "transcription_provider" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "transcribed_at" timestamp;