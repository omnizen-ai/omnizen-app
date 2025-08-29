# OmniZen AI Chatbot Project Overview

## Project Purpose
OmniZen AI Chatbot is an open-source chatbot application built with Next.js and Vercel's AI SDK. It provides a modern chat interface with support for multiple AI model providers, data persistence, and authentication.

## Tech Stack

### Core Framework
- **Next.js 15** (with App Router and React Server Components)
- **React 19 RC** 
- **TypeScript** (strict mode enabled)

### AI & Chat
- **AI SDK** by Vercel for unified LLM interactions
- **xAI (grok-2-1212)** as default model provider
- Support for multiple providers (OpenAI, Anthropic, etc.)

### Styling & UI
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Radix UI** for accessible component primitives
- **Framer Motion** for animations
- **Lucide React** for icons

### Data & Storage
- **Neon Serverless Postgres** for chat history and user data
- **Drizzle ORM** for database operations
- **Vercel Blob** for file storage
- **Redis** for caching/session management

### Authentication
- **Auth.js** (NextAuth v5 beta)

### Editor Components
- **ProseMirror** for rich text editing
- **CodeMirror** for code editing
- **Streamdown** for markdown processing

### Development Tools
- **pnpm** as package manager
- **Biome** for linting and formatting
- **ESLint** for additional linting
- **Playwright** for testing
- **Drizzle Kit** for database migrations

## Project Structure
```
omnizen-app/
├── app/                  # Next.js App Router pages
│   ├── (auth)/          # Authentication pages
│   └── (chat)/          # Chat interface pages
├── components/          # React components
├── lib/                 # Core libraries and utilities
│   ├── ai/             # AI SDK integrations
│   ├── artifacts/      # Artifact handling
│   ├── db/             # Database models and migrations
│   └── editor/         # Editor utilities
├── hooks/              # Custom React hooks
├── public/             # Static assets
└── tests/             # Test files
```

## Key Features
- Real-time chat with AI models
- Multi-provider AI support
- Rich text and code editing capabilities
- User authentication
- Chat history persistence
- File upload and storage
- Dark/light theme support
- Responsive UI design