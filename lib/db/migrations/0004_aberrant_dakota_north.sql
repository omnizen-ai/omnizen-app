-- Enable pgvector extension for vector operations (required for document embeddings)
CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "vectors";
--> statement-breakpoint
-- Add vectors schema to search path for this session
SET search_path TO "$user", public, extensions, vectors;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."document_status" AS ENUM('uploaded', 'processing', 'processed', 'failed', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."document_type" AS ENUM('pdf', 'csv', 'xlsx', 'docx', 'txt', 'image', 'receipt', 'invoice', 'contract', 'statement', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "document_access_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"access_type" text NOT NULL,
	"user_agent" text,
	"ip_address" text,
	"context" jsonb,
	"accessed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "document_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid,
	"document_id" uuid NOT NULL,
	"chunk_index" integer DEFAULT 0 NOT NULL,
	"chunk_count" integer DEFAULT 1 NOT NULL,
	"content" text NOT NULL,
	"content_hash" text,
	"embedding" vector(1536),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"document_type" "document_type",
	"category" text,
	"search_text" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "document_processing_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"job_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"progress" integer DEFAULT 0,
	"total_steps" integer DEFAULT 1,
	"current_step" integer DEFAULT 0,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"result" jsonb,
	"error" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"duration" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"file_name" text NOT NULL,
	"file_type" "document_type" NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" text,
	"storage_url" text NOT NULL,
	"storage_bucket" text DEFAULT 'documents' NOT NULL,
	"storage_key" text NOT NULL,
	"status" "document_status" DEFAULT 'uploaded' NOT NULL,
	"processed_at" timestamp,
	"processing_error" text,
	"extracted_text" text,
	"text_length" integer,
	"language" text DEFAULT 'en',
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"category" text,
	"tags" jsonb DEFAULT '[]',
	"auto_tags" jsonb DEFAULT '[]',
	"is_public" boolean DEFAULT false NOT NULL,
	"allowed_users" jsonb,
	"search_text" text,
	"related_invoice_id" uuid,
	"related_bill_id" uuid,
	"related_contract_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "document_access_logs" ADD CONSTRAINT "document_access_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "document_access_logs" ADD CONSTRAINT "document_access_logs_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "document_access_logs" ADD CONSTRAINT "document_access_logs_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "document_embeddings" ADD CONSTRAINT "document_embeddings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "document_embeddings" ADD CONSTRAINT "document_embeddings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "document_embeddings" ADD CONSTRAINT "document_embeddings_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "document_processing_jobs" ADD CONSTRAINT "document_processing_jobs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "document_processing_jobs" ADD CONSTRAINT "document_processing_jobs_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_created_by_User_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doc_access_org_idx" ON "document_access_logs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doc_access_document_idx" ON "document_access_logs" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doc_access_user_idx" ON "document_access_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doc_access_type_idx" ON "document_access_logs" USING btree ("access_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doc_access_date_idx" ON "document_access_logs" USING btree ("accessed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doc_emb_org_idx" ON "document_embeddings" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doc_emb_document_idx" ON "document_embeddings" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doc_emb_chunk_idx" ON "document_embeddings" USING btree ("document_id","chunk_index");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doc_emb_type_idx" ON "document_embeddings" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doc_emb_category_idx" ON "document_embeddings" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doc_emb_hash_idx" ON "document_embeddings" USING btree ("content_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doc_job_org_idx" ON "document_processing_jobs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doc_job_document_idx" ON "document_processing_jobs" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doc_job_status_idx" ON "document_processing_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doc_job_type_idx" ON "document_processing_jobs" USING btree ("job_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doc_org_idx" ON "documents" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doc_workspace_idx" ON "documents" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doc_status_idx" ON "documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doc_type_idx" ON "documents" USING btree ("file_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doc_category_idx" ON "documents" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doc_created_idx" ON "documents" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "doc_storage_key_idx" ON "documents" USING btree ("storage_key");