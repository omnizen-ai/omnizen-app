-- Add vectors schema to search path for this session
SET search_path TO "$user", public, extensions, vectors;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."batch_status" AS ENUM('pending', 'processing', 'completed', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."query_complexity" AS ENUM('simple', 'moderate', 'complex', 'advanced');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."query_intent" AS ENUM('read', 'write', 'analyze', 'search', 'report', 'admin', 'unknown');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "query_batch_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"batch_id" text NOT NULL,
	"status" "batch_status" DEFAULT 'pending' NOT NULL,
	"total_queries" integer NOT NULL,
	"processed_queries" integer DEFAULT 0 NOT NULL,
	"failed_queries" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"processing_time" integer,
	"config" jsonb DEFAULT '{}' NOT NULL,
	"results" jsonb,
	"errors" jsonb,
	"triggered_by" uuid,
	"trigger_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "query_evolution" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"parent_query_id" uuid NOT NULL,
	"original_context" text NOT NULL,
	"new_context" text NOT NULL,
	"adaptation_reason" text NOT NULL,
	"context_similarity" numeric(5, 4),
	"query_modifications" jsonb DEFAULT '[]' NOT NULL,
	"execution_success" boolean NOT NULL,
	"execution_time" integer,
	"result_quality" numeric(5, 4),
	"feedback_loop" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "query_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"query_intelligence_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"accuracy" integer,
	"performance" integer,
	"relevance" integer,
	"comments" text,
	"suggested_improvements" text,
	"session_context" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "query_intelligence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid,
	"query_hash" text NOT NULL,
	"query_pattern" text NOT NULL,
	"original_query" text NOT NULL,
	"intent" "query_intent" NOT NULL,
	"complexity" "query_complexity" NOT NULL,
	"tables_used" jsonb DEFAULT '[]' NOT NULL,
	"user_prompt" text,
	"context_embedding" vector(1536),
	"query_embedding" vector(1536),
	"execution_count" integer DEFAULT 1 NOT NULL,
	"total_execution_time" integer DEFAULT 0 NOT NULL,
	"avg_execution_time" numeric(10, 3),
	"success_rate" numeric(5, 4) DEFAULT '1.0000' NOT NULL,
	"similarity_searches" integer DEFAULT 0 NOT NULL,
	"adaptations" integer DEFAULT 0 NOT NULL,
	"confidence_score" numeric(5, 4) DEFAULT '0.5000' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"first_seen" timestamp DEFAULT now() NOT NULL,
	"last_used" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "query_patterns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"pattern_name" text NOT NULL,
	"pattern_template" text NOT NULL,
	"pattern_description" text,
	"business_domain" text,
	"use_cases" jsonb DEFAULT '[]',
	"usage_count" integer DEFAULT 0 NOT NULL,
	"average_performance" numeric(10, 3),
	"confidence_level" numeric(5, 4) DEFAULT '0.5000' NOT NULL,
	"parameters" jsonb DEFAULT '[]' NOT NULL,
	"derived_from" jsonb DEFAULT '[]',
	"is_active" boolean DEFAULT true NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "query_batch_jobs" ADD CONSTRAINT "query_batch_jobs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "query_batch_jobs" ADD CONSTRAINT "query_batch_jobs_triggered_by_User_id_fk" FOREIGN KEY ("triggered_by") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "query_evolution" ADD CONSTRAINT "query_evolution_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "query_evolution" ADD CONSTRAINT "query_evolution_parent_query_id_query_intelligence_id_fk" FOREIGN KEY ("parent_query_id") REFERENCES "public"."query_intelligence"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "query_feedback" ADD CONSTRAINT "query_feedback_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "query_feedback" ADD CONSTRAINT "query_feedback_query_intelligence_id_query_intelligence_id_fk" FOREIGN KEY ("query_intelligence_id") REFERENCES "public"."query_intelligence"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "query_feedback" ADD CONSTRAINT "query_feedback_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "query_intelligence" ADD CONSTRAINT "query_intelligence_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "query_intelligence" ADD CONSTRAINT "query_intelligence_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "query_patterns" ADD CONSTRAINT "query_patterns_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "qbj_org_idx" ON "query_batch_jobs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "qbj_status_idx" ON "query_batch_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "qbj_batch_idx" ON "query_batch_jobs" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "qbj_triggered_idx" ON "query_batch_jobs" USING btree ("triggered_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "qe_org_idx" ON "query_evolution" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "qe_parent_idx" ON "query_evolution" USING btree ("parent_query_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "qe_success_idx" ON "query_evolution" USING btree ("execution_success");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "qe_similarity_idx" ON "query_evolution" USING btree ("context_similarity");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "qf_org_idx" ON "query_feedback" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "qf_query_idx" ON "query_feedback" USING btree ("query_intelligence_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "qf_user_idx" ON "query_feedback" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "qf_rating_idx" ON "query_feedback" USING btree ("rating");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "qi_org_idx" ON "query_intelligence" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "qi_workspace_idx" ON "query_intelligence" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "qi_hash_idx" ON "query_intelligence" USING btree ("organization_id","query_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "qi_intent_idx" ON "query_intelligence" USING btree ("intent");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "qi_complexity_idx" ON "query_intelligence" USING btree ("complexity");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "qi_confidence_idx" ON "query_intelligence" USING btree ("confidence_score");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "qi_last_used_idx" ON "query_intelligence" USING btree ("last_used");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "qi_tables_idx" ON "query_intelligence" USING btree ("tables_used");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "qp_org_idx" ON "query_patterns" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "qp_domain_idx" ON "query_patterns" USING btree ("business_domain");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "qp_usage_idx" ON "query_patterns" USING btree ("usage_count");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "qp_confidence_idx" ON "query_patterns" USING btree ("confidence_level");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "qp_active_idx" ON "query_patterns" USING btree ("is_active");