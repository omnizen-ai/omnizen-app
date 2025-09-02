# Test Scripts

This directory contains comprehensive test suites for the OmniZen ERP platform, organized by business model.

## Directory Structure

```
scripts/
├── business-tests/      # B2B ERP tests for business organizations
├── personal-tests/      # B2C personal finance tests
└── verify-dual-auth.ts  # Authentication verification utility
```

## Business Tests (B2B)

Tests for traditional business ERP functionality including:
- Multi-organization setup (Anchorblock, Team Qreative)
- Double-entry accounting
- Invoicing and billing
- Inventory management
- Financial reporting
- Multi-tenancy and RLS

**Run individual tests:**
```bash
npx tsx scripts/business-tests/00-onboarding/01-signup.test.ts
```

## Personal Tests (B2C)

Tests for personal finance features including:
- OmniZen organization setup
- Individual workspace creation
- Personal budgeting
- Investment tracking
- Subscription management

**Run individual tests:**
```bash
npx tsx scripts/personal-tests/P00-onboarding/01-personal-signup.test.ts
```

## Authentication Verification

Verify the dual authentication system:
```bash
npx tsx scripts/verify-dual-auth.ts
```

## Test Plans

- **Business Tests**: See `business-tests/BUSINESS_TEST_PLAN.md`
- **Personal Tests**: See `personal-tests/PERSONAL_FINANCE_TEST_PLAN.md`

## Prerequisites

1. Local Supabase running: `supabase start`
2. Migrations applied: `pnpm migrate:local`
3. Environment variables configured in `.env.local`

## Note

All tests operate directly at the database level without UI interaction, ensuring core business logic integrity.