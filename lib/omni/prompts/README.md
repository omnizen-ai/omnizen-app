# OpenCode Prompts Collection

This directory contains all prompts extracted from the OpenCode repository located at `/tmp/opencode`.

## Prompt Files

All prompts were copied from `/tmp/opencode/packages/opencode/src/session/prompt/`:

### Main Model Prompts
1. **anthropic.txt** (10.5 KB) - Main Anthropic Claude prompt
2. **anthropic_spoof.txt** (58 bytes) - Header prompt for Anthropic models
3. **beast.txt** (11 KB) - Prompt for GPT/O1/O3 models
4. **codex.txt** (20.5 KB) - Detailed coding agent prompt for OpenCode
5. **copilot-gpt-5.txt** (14.2 KB) - Prompt for GPT-5 models
6. **gemini.txt** (15.4 KB) - Prompt for Google Gemini models
7. **qwen.txt** (9.7 KB) - Prompt for models without TODO support (fallback)

### Functional Prompts
8. **build-switch.txt** (188 bytes) - Mode switch from plan to build
9. **initialize.txt** (598 bytes) - Prompt for creating AGENTS.md file
10. **plan.txt** (480 bytes) - Read-only plan mode restrictions
11. **summarize.txt** (467 bytes) - Conversation summarization prompt
12. **title.txt** (1 KB) - Title generation prompt

## Usage in OpenCode

Based on the system.ts file analysis:

### Model Selection Logic
- GPT-5: Uses `copilot-gpt-5.txt`
- GPT/O1/O3 models: Uses `beast.txt`  
- Gemini models: Uses `gemini.txt`
- Claude models: Uses `anthropic.txt`
- Default/Other models: Uses `qwen.txt` (without TODO support)

### Header Prompts
- Anthropic models get `anthropic_spoof.txt` as a header

### Special Purpose Prompts
- Summarization: Uses `summarize.txt` with appropriate header
- Title generation: Uses `title.txt` with appropriate header
- Initialization: Uses `initialize.txt` for creating AGENTS.md
- Mode switching: Uses `plan.txt` and `build-switch.txt` for mode transitions

## File Locations
- Source: `/tmp/opencode/packages/opencode/src/session/prompt/`
- Destination: `/Users/kalam/Codespace/omnizen-app/lib/omni/prompts/`

## Notes
- All files were copied as-is without modification
- The prompts are imported and used dynamically in the OpenCode system
- Model selection is based on model ID string matching