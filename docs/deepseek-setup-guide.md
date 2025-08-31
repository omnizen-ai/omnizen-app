# DeepSeek Integration Guide

## Overview
DeepSeek models are now integrated into Omnizen as cost-effective alternatives to Claude and GPT models. DeepSeek offers significant cost savings while maintaining good performance for most business tasks.

## Available Models

### 1. **DeepSeek Chat** (`deepseek-chat`)
- **Purpose**: General-purpose chat and business queries
- **Cost**: ~90% cheaper than Claude 3.5 Sonnet
- **Best for**: Regular business queries, data lookups, reports
- **Token optimization**: Automatically uses ultra-compressed prompts (95-99% reduction)

### 2. **DeepSeek Reasoner** (`deepseek-reasoner`)
- **Purpose**: Complex reasoning and multi-step problem solving
- **Cost**: ~85% cheaper than GPT-4
- **Best for**: Financial analysis, complex calculations, decision support
- **Token optimization**: Uses modular prompts based on query complexity

## How to Use DeepSeek

### Step 1: Set Up API Key
1. Get your DeepSeek API key from [https://platform.deepseek.com/](https://platform.deepseek.com/)
2. Add to your `.env.local` file:
   ```env
   DEEPSEEK_API_KEY=sk-your-deepseek-api-key-here
   ```

### Step 2: Select DeepSeek Model in UI
1. Open the Omnizen app at http://localhost:3000
2. Look for the **model selector dropdown** in the chat interface (top of the chat input area)
3. Click the dropdown - you'll see:
   - Chat model (Claude 3.5 Sonnet) - Default
   - Reasoning model (GPT-4o-mini)
   - **DeepSeek Chat** - Cost-effective option
   - **DeepSeek Reasoner** - Advanced reasoning

### Step 3: Choose Based on Your Needs

| Task Type | Recommended Model | Why |
|-----------|------------------|-----|
| Simple queries ("Hi", "Show customers") | DeepSeek Chat | 99% token savings, instant responses |
| Business data lookups | DeepSeek Chat | Handles SQL queries efficiently |
| Financial reports | DeepSeek Chat | Good formatting, cost-effective |
| Complex analysis | DeepSeek Reasoner | Better reasoning capabilities |
| Critical documents | Claude (Chat model) | Highest quality output |

## Default Model Configuration

Currently, the default model is still **Claude 3.5 Sonnet** (`chat-model`). To change the default:

### Option 1: User Preference (Persistent)
- Select DeepSeek from the dropdown
- The app saves your choice as a cookie
- It will remember your preference for future sessions

### Option 2: System Default (Code Change)
To make DeepSeek the system default, update `/lib/ai/models.ts`:

```typescript
export const DEFAULT_CHAT_MODEL: string = 'deepseek-chat'; // Changed from 'chat-model'
```

## Cost Comparison

| Model | Cost per 1M tokens | Relative Cost |
|-------|-------------------|---------------|
| Claude 3.5 Sonnet | $3.00 input / $15.00 output | 100% (baseline) |
| GPT-4o-mini | $0.15 input / $0.60 output | ~5% |
| **DeepSeek Chat** | $0.14 input / $0.28 output | ~3% |
| **DeepSeek Reasoner** | $0.55 input / $2.19 output | ~15% |

With token optimization:
- Simple queries: 10-50 tokens (vs 2000+) = **Additional 95-99% savings**
- Business queries: 250 tokens (vs 2000+) = **Additional 87% savings**

**Total savings with DeepSeek + optimization: Up to 99.97% cost reduction**

## Token Optimization with DeepSeek

The system automatically applies token optimization based on query type:

1. **Greetings** ("Hi", "Hello") → 10 tokens
2. **Simple queries** ("Show customers") → 30-50 tokens
3. **Business queries** ("Invoices for Acme") → 250 tokens
4. **Reports** ("Balance sheet") → 700 tokens

DeepSeek models work seamlessly with all optimization levels.

## Performance Expectations

### DeepSeek Chat
- ✅ Excellent for routine business queries
- ✅ Fast response times
- ✅ Good SQL query generation
- ✅ Proper markdown formatting
- ⚠️ May need clarification on complex requests
- ⚠️ Less creative than Claude for content generation

### DeepSeek Reasoner
- ✅ Strong multi-step reasoning
- ✅ Good for financial calculations
- ✅ Handles complex business logic
- ⚠️ Slower than DeepSeek Chat
- ⚠️ Higher cost than Chat model

## Troubleshooting

### Model Not Appearing in Dropdown
1. Ensure you've restarted the dev server after adding the API key
2. Check that your `.env.local` includes `DEEPSEEK_API_KEY`
3. Verify the app is running: `pnpm dev`

### API Errors
1. Verify your API key is valid at [platform.deepseek.com](https://platform.deepseek.com)
2. Check you have credits in your DeepSeek account
3. Look for errors in the console: `pnpm dev`

### Quality Issues
- For critical tasks, switch back to Claude (Chat model)
- For complex reasoning, use DeepSeek Reasoner instead of Chat
- The system maintains all business logic regardless of model

## Best Practices

1. **Start with DeepSeek Chat** for most queries to maximize savings
2. **Upgrade to Claude** only for critical documents or creative tasks
3. **Use DeepSeek Reasoner** for complex multi-step problems
4. **Monitor costs** in your DeepSeek dashboard
5. **Token optimization** is automatic - no configuration needed

## Integration Details

- DeepSeek uses its native SDK (`@ai-sdk/deepseek`)
- Full compatibility with existing Omnizen features
- All MCP tools work with DeepSeek models
- Token optimization applies automatically
- No changes needed to existing prompts or workflows

## Summary

DeepSeek integration provides:
- **90-97% base cost reduction** compared to Claude
- **Additional 95-99% savings** from token optimization
- **Total potential savings: 99.97%** for simple queries
- Full Omni AI Business Partner capabilities
- Seamless model switching via dropdown
- Automatic optimization based on query type

To use: Simply select "DeepSeek Chat" or "DeepSeek Reasoner" from the model dropdown in the chat interface!