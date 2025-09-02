DO $$ BEGIN
 CREATE TYPE "public"."asset_type_enum" AS ENUM('stock', 'etf', 'mutual_fund', 'bond', 'crypto', 'commodity');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."budget_period_enum" AS ENUM('weekly', 'monthly', 'quarterly', 'yearly');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."goal_status_enum" AS ENUM('active', 'paused', 'completed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."goal_type_enum" AS ENUM('savings', 'debt_payoff', 'investment', 'purchase', 'emergency_fund', 'retirement');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."subscription_frequency_enum" AS ENUM('weekly', 'monthly', 'quarterly', 'annual');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "plan_tier" ADD VALUE 'personal-free';--> statement-breakpoint
ALTER TYPE "plan_tier" ADD VALUE 'personal-plus';--> statement-breakpoint
ALTER TYPE "plan_tier" ADD VALUE 'personal-pro';--> statement-breakpoint
ALTER TYPE "plan_tier" ADD VALUE 'family';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "budget_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"category_id" uuid,
	"period" "budget_period_enum" DEFAULT 'monthly',
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
	"goal_type" "goal_type_enum" NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"target_amount" numeric(15, 2) NOT NULL,
	"current_amount" numeric(15, 2) DEFAULT '0',
	"target_date" date,
	"priority" integer DEFAULT 1,
	"auto_allocate" boolean DEFAULT false,
	"allocation_amount" numeric(15, 2),
	"allocation_frequency" varchar(20),
	"status" "goal_status_enum" DEFAULT 'active',
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
	"asset_type" "asset_type_enum",
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
	"frequency" "subscription_frequency_enum",
	"next_billing_date" date,
	"is_active" boolean DEFAULT true,
	"cancellation_url" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."organization_type" AS ENUM('business', 'personal', 'hybrid');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "organization_type" "organization_type" DEFAULT 'business';--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "is_personal_finance" boolean DEFAULT false;--> statement-breakpoint
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