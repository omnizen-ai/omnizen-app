# Task Completion Checklist

When you complete any coding task in this project, make sure to:

## 1. Code Quality Checks
- [ ] Run linting: `pnpm lint`
- [ ] Fix any linting errors: `pnpm lint:fix`
- [ ] Format code: `pnpm format`

## 2. Type Safety
- [ ] Ensure no TypeScript errors exist
- [ ] Check that strict mode compliance is maintained
- [ ] Verify proper typing (no `any` types unless absolutely necessary)

## 3. Build Verification
- [ ] Run build command to ensure no build errors: `pnpm build`
- [ ] Verify that all imports are correct
- [ ] Check for any unused imports or variables

## 4. Testing (if applicable)
- [ ] Run existing tests: `pnpm test`
- [ ] Add new tests for new functionality
- [ ] Ensure all tests pass

## 5. Database Changes (if applicable)
- [ ] Generate migrations if schema changed: `pnpm db:generate`
- [ ] Run migrations: `pnpm db:migrate`
- [ ] Test database operations

## 6. Component Guidelines
- [ ] Follow React Server Component patterns where applicable
- [ ] Use proper client/server component separation
- [ ] Implement loading and error states
- [ ] Follow accessibility best practices

## 7. Performance
- [ ] Check for unnecessary re-renders
- [ ] Optimize images and assets
- [ ] Use proper Next.js optimization features

## 8. Security
- [ ] No exposed secrets or API keys
- [ ] Proper input validation
- [ ] Follow authentication best practices
- [ ] Use environment variables correctly

## 9. Documentation
- [ ] Update relevant documentation if needed
- [ ] Add JSDoc comments for complex functions
- [ ] Update README if setup steps changed

## 10. Final Checks
- [ ] Verify feature works as expected
- [ ] Test in development mode: `pnpm dev`
- [ ] Check browser console for errors
- [ ] Review changes one more time

## Quick Command Sequence
For most tasks, run these commands in order:
```bash
pnpm lint:fix      # Fix linting issues
pnpm format        # Format code
pnpm build         # Verify build succeeds
pnpm test          # Run tests (if applicable)
```