# Suggested Commands for OmniZen AI Chatbot

## Development Commands

### Starting Development
```bash
pnpm dev           # Start Next.js development server with Turbo mode
```

### Building & Production
```bash
pnpm build         # Run database migrations and build the Next.js app
pnpm start         # Start production server
```

## Code Quality Commands

### Linting
```bash
pnpm lint          # Run Next.js linter and Biome linter with auto-fix
pnpm lint:fix      # Fix linting issues automatically
```

### Formatting
```bash
pnpm format        # Format code using Biome
```

## Database Commands

### Drizzle ORM Operations
```bash
pnpm db:generate   # Generate database migrations
pnpm db:migrate    # Run database migrations
pnpm db:studio     # Open Drizzle Studio for database management
pnpm db:push       # Push schema changes to database
pnpm db:pull       # Pull database schema
pnpm db:check      # Check database schema
pnpm db:up         # Apply database updates
```

## Testing
```bash
pnpm test          # Run Playwright tests
```

## Package Management
```bash
pnpm install       # Install dependencies
pnpm add <package> # Add new dependency
pnpm remove <package> # Remove dependency
```

## Git Commands (macOS/Darwin)
```bash
git status         # Check repository status
git add .          # Stage all changes
git commit -m "message"  # Commit changes
git push           # Push to remote
git pull           # Pull latest changes
git branch         # List branches
git checkout -b <branch>  # Create and switch to new branch
```

## Environment Setup
```bash
vercel link        # Link local instance with Vercel
vercel env pull    # Download environment variables from Vercel
```

## System Utilities (macOS/Darwin)
```bash
ls -la             # List files with details
find . -name "*.ts"  # Find TypeScript files
grep -r "pattern" .  # Search for pattern in files
open .             # Open current directory in Finder
pbcopy < file      # Copy file contents to clipboard
pbpaste > file     # Paste clipboard contents to file
```

## Important Notes
- Always use `pnpm` for package management (never npm or yarn)
- Run `pnpm lint` and `pnpm format` before committing code
- Use environment variables from `.env.example` as reference
- The project uses Vercel for deployment