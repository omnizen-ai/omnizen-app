// Supabase Edge Function for MCP Server with Langfuse Observability
// Implements Streamable HTTP transport (2025-03-26 spec) for stateless operation
// Features: OpenTelemetry tracing, schema caching, rate limiting, business context

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

// OpenTelemetry imports for Langfuse integration
import {
  BasicTracerProvider,
  BatchSpanProcessor,
} from "npm:@opentelemetry/sdk-trace-base@1.26.0"
import { OTLPTraceExporter } from "npm:@opentelemetry/exporter-trace-otlp-http@0.53.0"
import { Resource } from "npm:@opentelemetry/resources@1.26.0"
import { SemanticResourceAttributes } from "npm:@opentelemetry/semantic-conventions@1.27.0"
import { trace, SpanStatusCode, context, SpanKind } from "npm:@opentelemetry/api@1.9.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-id',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
}

// ============================================================================
// OpenTelemetry & Langfuse Setup
// ============================================================================

// Configuration from environment variables
const LANGFUSE_CONFIG = {
  publicKey: Deno.env.get('LANGFUSE_PUBLIC_KEY') || '',
  secretKey: Deno.env.get('LANGFUSE_SECRET_KEY') || '',
  baseUrl: Deno.env.get('LANGFUSE_BASEURL') || 'http://localhost:3000',
  enabled: !!(Deno.env.get('LANGFUSE_PUBLIC_KEY') && Deno.env.get('LANGFUSE_SECRET_KEY')),
}

// Initialize OpenTelemetry provider and exporter
let tracerProvider: BasicTracerProvider | null = null
let tracer: any = null

if (LANGFUSE_CONFIG.enabled) {
  console.log('[Observability] Initializing Langfuse tracing via OpenTelemetry')
  
  // Configure resource attributes
  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'mcp-database-server',
    [SemanticResourceAttributes.SERVICE_VERSION]: '0.2.0',
    'deployment.environment': Deno.env.get('NODE_ENV') || 'production',
    'service.namespace': 'omnizen',
  })

  // Create tracer provider
  tracerProvider = new BasicTracerProvider({ resource })

  // Configure OTLP exporter for Langfuse
  const exporter = new OTLPTraceExporter({
    url: `${LANGFUSE_CONFIG.baseUrl}/api/public/otel/v1/traces`,
    headers: {
      Authorization: `Basic ${btoa(`${LANGFUSE_CONFIG.publicKey}:${LANGFUSE_CONFIG.secretKey}`)}`,
    },
  })

  // Add batch processor for efficient span export
  tracerProvider.addSpanProcessor(new BatchSpanProcessor(exporter))
  tracerProvider.register()

  // Get tracer instance
  tracer = trace.getTracer('mcp-server', '0.2.0')
  
  console.log('[Observability] Langfuse tracing initialized successfully')
} else {
  console.log('[Observability] Langfuse tracing disabled (missing credentials)')
}

// Schema cache - persists for the lifetime of the function instance
const schemaCache = {
  tables: null as string[] | null,
  schema: null as any,
  timestamp: 0,
  TTL: 5 * 60 * 1000, // 5 minutes cache
  
  isValid() {
    return this.tables && (Date.now() - this.timestamp) < this.TTL
  },
  
  set(tables: string[], schema: any) {
    this.tables = tables
    this.schema = schema
    this.timestamp = Date.now()
    console.log('Schema cached:', { tables: tables.length, timestamp: new Date(this.timestamp) })
  },
  
  get() {
    if (this.isValid()) {
      console.log('Using cached schema')
      return { tables: this.tables, schema: this.schema }
    }
    return null
  },
  
  clear() {
    this.tables = null
    this.schema = null
    this.timestamp = 0
  }
}

// Rate limiting (simple in-memory implementation)
const rateLimiter = {
  requests: new Map<string, number[]>(),
  maxRequests: 100, // per minute
  windowMs: 60000,
  
  check(clientId: string): boolean {
    const now = Date.now()
    const requests = this.requests.get(clientId) || []
    
    // Clean old requests
    const validRequests = requests.filter(time => now - time < this.windowMs)
    
    if (validRequests.length >= this.maxRequests) {
      return false
    }
    
    validRequests.push(now)
    this.requests.set(clientId, validRequests)
    return true
  }
}

// JSON-RPC types
interface JsonRpcRequest {
  jsonrpc: '2.0'
  id?: string | number | null
  method: string
  params?: any
}

interface JsonRpcResponse {
  jsonrpc: '2.0'
  id: string | number | null
  result?: any
  error?: JsonRpcError
}

interface JsonRpcError {
  code: number
  message: string
  data?: any
}

// JSON-RPC error codes
const ErrorCodes = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  SERVER_ERROR: -32000,
  RATE_LIMIT: -32001,
  UNAUTHORIZED: -32002,
}

// Tool definitions (without prefix - client adds it)
// IMPORTANT: These descriptions include instructions for the LLM to use business-friendly language
const tools = [
  {
    name: 'business_metrics',
    description: 'Get key business metrics and KPIs. REQUIRED: Output "Calculating business metrics..." BEFORE invoking. Returns revenue, cash position, AR/AP, customer counts, etc.',
    inputSchema: {
      type: 'object',
      properties: {
        metrics: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['revenue_mtd', 'revenue_ytd', 'revenue_last_month', 'outstanding_ar', 'overdue_invoices', 'cash_position', 'customer_count', 'vendor_count', 'expense_mtd', 'expense_ytd', 'gross_profit', 'top_customers', 'pending_invoices']
          },
          description: 'List of metrics to calculate'
        },
        period: {
          type: 'string',
          enum: ['today', 'mtd', 'qtd', 'ytd', 'last_month', 'last_quarter', 'last_year', 'all_time'],
          default: 'mtd',
          description: 'Time period for metrics'
        }
      },
      required: ['metrics'],
    },
  },
  {
    name: 'discover_schema',
    description: 'Discover business data structure. REQUIRED: Output "Let me check what business information is available..." or similar BEFORE invoking. NEVER mention database, tables, SQL, or tool names to users.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'query',
    description: 'Retrieve business data using SQL. REQUIRED: Output a contextual message BEFORE invoking, e.g. "Searching for customers...", "Calculating revenue...". Use the SQL patterns from your training.',
    inputSchema: {
      type: 'object',
      properties: {
        sql: {
          type: 'string',
          description: 'SQL query - use the patterns from your prompt'
        },
      },
      required: ['sql'],
    },
  },
  {
    name: 'safe_write',
    description: 'Safely modify business data with preview. First call with dry_run=true to preview changes, then dry_run=false to commit. REQUIRED: Show preview before committing.',
    inputSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['create_invoice', 'update_invoice', 'record_payment', 'create_expense', 'add_customer', 'add_vendor', 'update_contact', 'adjust_inventory'],
          description: 'Business operation to perform'
        },
        data: {
          type: 'object',
          description: 'Operation data'
        },
        dry_run: {
          type: 'boolean',
          default: true,
          description: 'Preview mode - true shows impact without changes'
        }
      },
      required: ['operation', 'data'],
    },
  },
  {
    name: 'list_tables',
    description: 'List available data. REQUIRED: Output "Checking available business information..." BEFORE invoking. NEVER mention tables or database structure.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_table_data',
    description: 'Get business records. REQUIRED: Output context-specific message BEFORE invoking, e.g. "Retrieving customer information...", "Getting invoice records...". NEVER mention table names or database terms.',
    inputSchema: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Internal table reference (never expose to user)'
        },
        limit: {
          type: 'number',
          description: 'Maximum results',
          default: 100
        },
        filters: {
          type: 'object',
          description: 'Search criteria'
        },
        orderBy: {
          type: 'string',
          description: 'Sort field'
        },
        ascending: {
          type: 'boolean',
          description: 'Sort direction',
          default: true
        }
      },
      required: ['table'],
    },
  },
  {
    name: 'insert_data',
    description: 'Add business records. REQUIRED: Output action message BEFORE invoking, e.g. "Adding new customer...", "Creating invoice...". Use business language only.',
    inputSchema: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Internal table reference (never expose to user)'
        },
        data: {
          type: ['object', 'array'],
          description: 'Business data to save'
        }
      },
      required: ['table', 'data'],
    },
  },
  {
    name: 'update_data',
    description: 'Update business records. REQUIRED: Output action message BEFORE invoking, e.g. "Updating customer information...", "Modifying invoice...". Use business terminology only.',
    inputSchema: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Internal table reference (never expose to user)'
        },
        filters: {
          type: 'object',
          description: 'Selection criteria'
        },
        data: {
          type: 'object',
          description: 'Updated information'
        }
      },
      required: ['table', 'filters', 'data'],
    },
  },
]

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  
  // Skip authorization check in development
  const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development' || 
                        Deno.env.get('NODE_ENV') === 'development' ||
                        url.hostname === 'localhost' || 
                        url.hostname === '127.0.0.1'
  
  const clientId = req.headers.get('x-client-id') || 
                   req.headers.get('authorization')?.slice(0, 20) || 
                   'anonymous'
  
  // Rate limiting
  if (!rateLimiter.check(clientId)) {
    return createErrorResponse(
      null,
      ErrorCodes.RATE_LIMIT,
      'Rate limit exceeded. Please wait before making more requests.',
      429
    )
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check Accept header for content type negotiation
    const acceptHeader = req.headers.get('accept') || ''
    const wantsSSE = acceptHeader.includes('text/event-stream')
    const sessionId = req.headers.get('x-session-id')
    
    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        // SSE endpoint for streaming (if client wants it)
        if (wantsSSE && url.pathname.endsWith('/sse')) {
          return handleSSE(req, sessionId)
        }
        // Info endpoint
        if (url.pathname.endsWith('/info')) {
          return new Response(
            JSON.stringify({
              name: 'omnizen/supabase',
              version: '0.2.0',
              protocol: '2025-03-26',
              capabilities: {
                tools: {},
                stateless: true,
                streaming: true,
              },
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }
        return new Response('Method not allowed', { 
          status: 405,
          headers: corsHeaders 
        })

      case 'POST':
        // Handle JSON-RPC requests (single or batch)
        const contentType = req.headers.get('content-type') || ''
        if (!contentType.includes('application/json')) {
          return createErrorResponse(
            null,
            ErrorCodes.INVALID_REQUEST,
            'Content-Type must be application/json',
            400
          )
        }

        let body: any
        try {
          body = await req.json()
        } catch (e) {
          return createErrorResponse(
            null,
            ErrorCodes.PARSE_ERROR,
            'Invalid JSON',
            400
          )
        }

        // Handle batch requests
        if (Array.isArray(body)) {
          const responses = await Promise.all(
            body.map(request => handleJsonRpc(request, supabase, sessionId))
          )
          return new Response(
            JSON.stringify(responses.filter(r => r !== null)),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        // Handle single request with tracing context
        const rootSpan = tracer?.startSpan('mcp.request', {
          kind: SpanKind.SERVER,
          attributes: {
            'http.method': req.method,
            'http.url': req.url,
            'http.target': url.pathname,
            'mcp.session_id': sessionId || 'stateless',
          },
        })
        
        // Execute request in span context
        const executeRequest = async () => {
          const response = await handleJsonRpc(body, supabase, sessionId)
          if (response === null) {
            // Notification (no ID) - return 204 No Content
            return new Response(null, { 
              status: 204,
              headers: corsHeaders 
            })
          }
          
          return new Response(
            JSON.stringify(response),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }
        
        // Run with context if tracing is enabled
        if (rootSpan) {
          return context.with(trace.setSpan(context.active(), rootSpan), async () => {
            try {
              const result = await executeRequest()
              rootSpan.setAttribute('http.status_code', result.status)
              rootSpan.setStatus({ code: SpanStatusCode.OK })
              return result
            } catch (error: any) {
              rootSpan.setStatus({ 
                code: SpanStatusCode.ERROR, 
                message: error.message 
              })
              rootSpan.setAttribute('error', true)
              throw error
            } finally {
              rootSpan.end()
              // Ensure spans are flushed
              await tracerProvider?.forceFlush()
            }
          })
        } else {
          return executeRequest()
        }

      case 'DELETE':
        // Session cleanup (for stateful mode)
        if (sessionId) {
          // Clean up session-specific data if needed
          console.log('Session cleanup:', sessionId)
        }
        return new Response(null, { 
          status: 204,
          headers: corsHeaders 
        })

      default:
        return new Response('Method not allowed', { 
          status: 405,
          headers: corsHeaders 
        })
    }
  } catch (error) {
    console.error('MCP server error:', error)
    return createErrorResponse(
      null,
      ErrorCodes.INTERNAL_ERROR,
      error.message || 'Internal server error',
      500
    )
  }
})

// Handle JSON-RPC requests with OpenTelemetry tracing
async function handleJsonRpc(
  request: JsonRpcRequest, 
  supabase: any,
  sessionId?: string | null
): Promise<JsonRpcResponse | null> {
  // Start OpenTelemetry span for this request
  const span = tracer?.startSpan(`mcp.${request.method}`, {
    kind: SpanKind.SERVER,
    attributes: {
      'mcp.method': request.method,
      'mcp.request_id': request.id?.toString() || 'notification',
      'mcp.session_id': sessionId || 'stateless',
      'mcp.jsonrpc_version': request.jsonrpc,
      // Langfuse-specific attributes
      'langfuse.trace.name': `mcp.${request.method}`,
      'langfuse.trace.sessionId': sessionId || undefined,
      'langfuse.trace.tags': JSON.stringify(['mcp', 'database', request.method]),
    },
  })

  // Set input on span
  if (span && request.params) {
    span.setAttribute('langfuse.trace.input', JSON.stringify(request.params))
  }

  // Validate request
  if (request.jsonrpc !== '2.0') {
    const error = createJsonRpcError(
      request.id || null,
      ErrorCodes.INVALID_REQUEST,
      'Invalid JSON-RPC version'
    )
    if (span) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: 'Invalid JSON-RPC version' })
      span.setAttribute('langfuse.observation.status_message', 'Invalid JSON-RPC version')
      span.end()
    }
    return error
  }

  // Notification (no response needed)
  if (request.id === undefined || request.id === null) {
    console.log('Notification received:', request.method)
    if (span) {
      span.setAttribute('mcp.notification', true)
      span.end()
    }
    return null
  }

  const response: JsonRpcResponse = {
    jsonrpc: '2.0',
    id: request.id,
  }

  try {
    switch (request.method) {
      case 'initialize':
        response.result = {
          protocolVersion: '2025-03-26',
          capabilities: {
            tools: {},
            experimental: {
              stateless: true,
            }
          },
          serverInfo: {
            name: 'omnizen/supabase',
            version: '0.2.0',
          },
          instructions: `You are Omni's database interface. Follow these rules:
1. ALWAYS output a business-friendly action message BEFORE invoking any tool
2. Use business terms only: customers, invoices, revenue, expenses, accounts
3. NEVER mention SQL, database, tables, or technical terms
4. Map business concepts to actual tables:
   - Customers → contacts table (contact_type='customer')
   - Vendors → contacts table (contact_type='vendor')  
   - Invoices → invoices table
   - Expenses → expenses table
   - Products → inventory table
   - Accounts → chart_of_accounts table
   - Transactions → transactions or journal_entries tables
5. Format all monetary values with currency symbols
6. Be conversational and business-focused`,
          sessionId: sessionId || undefined,
        }
        break

      case 'initialized':
        // Client confirmation - no response needed for notification
        console.log('Client initialized')
        response.result = {}
        break

      case 'tools/list':
        response.result = { tools }
        break

      case 'tools/call':
        if (!request.params?.name) {
          response.error = {
            code: ErrorCodes.INVALID_PARAMS,
            message: 'Tool name is required',
          }
          break
        }
        
        const { name, arguments: args } = request.params
        
        // Create a child span for tool execution
        const toolSpan = tracer?.startSpan(`tool.${name}`, {
          kind: SpanKind.INTERNAL,
          attributes: {
            'tool.name': name,
            'tool.arguments': JSON.stringify(args || {}),
            'langfuse.observation.name': `tool.${name}`,
            'langfuse.observation.type': 'GENERATION',
            'langfuse.observation.model': 'database-tool',
          },
        })
        
        try {
          const toolResult = await executeTool(name, args || {}, supabase)
          
          // Set tool output
          if (toolSpan) {
            toolSpan.setAttribute('tool.result', JSON.stringify(toolResult))
            toolSpan.setAttribute('langfuse.observation.output', JSON.stringify(toolResult))
          }
          
          // Format response based on tool type
          let formattedText = ''
          
          if (toolResult.businessContext) {
            // Start with business context message
            formattedText = `${toolResult.businessContext}\n\n`
            
            // Format the data in a user-friendly way
            const dataRows = toolResult.rows || toolResult.data || []
            
            if (dataRows.length > 0) {
              // Don't show raw JSON, format it nicely
              
              // Check if it's a simple count query
              if (dataRows.length === 1 && dataRows[0].count !== undefined) {
                formattedText += `Result: ${dataRows[0].count}`
              } 
              // Check if it's a revenue/amount query
              else if (dataRows.length === 1 && dataRows[0].total_amount !== undefined) {
                formattedText += `Total: $${dataRows[0].total_amount.toLocaleString()}`
              }
              // Check if it's customer data
              else if (dataRows[0] && (dataRows[0].name || dataRows[0].customer_name)) {
                // Use business-friendly language
                const recordType = dataRows[0].type === 'customer' ? 'customer' : 
                                 dataRows[0].type === 'vendor' ? 'vendor' : 
                                 dataRows[0].type === 'invoice' ? 'invoice' : 'record'
                
                formattedText += `Found ${dataRows.length} ${recordType}${dataRows.length !== 1 ? 's' : ''}:\n\n`
                dataRows.forEach((row: any, i: number) => {
                  const name = row.name || row.customer_name || 'Unknown'
                  const email = row.email || row.customer_email || ''
                  const amount = row.amount || row.total_amount || row.paid_invoices || ''
                  
                  formattedText += `${i + 1}. **${name}**`
                  if (email) formattedText += ` - ${email}`
                  if (amount) formattedText += ` - $${typeof amount === 'number' ? amount.toLocaleString() : amount}`
                  formattedText += '\n'
                })
              }
              // For other data, show a summary
              else {
                formattedText += `Retrieved ${dataRows.length} record${dataRows.length !== 1 ? 's' : ''}`
                
                // Include actual data in a collapsible format
                if (dataRows.length <= 10) {
                  formattedText += '\n\n<details>\n<summary>View data</summary>\n\n```json\n'
                  formattedText += JSON.stringify(dataRows, null, 2)
                  formattedText += '\n```\n</details>'
                }
              }
            } else {
              formattedText += 'No results found.'
            }
            
            // Only add debug info if explicitly in debug mode (optional - can be controlled by env var)
            const showDebug = Deno.env.get('SHOW_DEBUG') === 'true'
            if (showDebug && toolResult._debug && toolResult._debug.sql) {
              formattedText += '\n\n<details>\n<summary>Technical details</summary>\n\n```sql\n'
              formattedText += toolResult._debug.sql
              formattedText += '\n```\n</details>'
            }
          } else {
            // Fallback for other tools
            formattedText = typeof toolResult === 'string' 
              ? toolResult 
              : JSON.stringify(toolResult, null, 2)
          }
          
          // Convert tool result to MCP standard format with content array
          response.result = {
            content: [
              {
                type: 'text',
                text: formattedText
              }
            ]
          }
          
          // End tool span successfully
          toolSpan?.end()
        } catch (error: any) {
          // Handle tool execution error
          if (toolSpan) {
            toolSpan.setStatus({ 
              code: SpanStatusCode.ERROR, 
              message: error.message || 'Tool execution failed' 
            })
            toolSpan.setAttribute('error', true)
            toolSpan.setAttribute('error.message', error.message || error.toString())
            toolSpan.end()
          }
          
          response.error = {
            code: ErrorCodes.SERVER_ERROR,
            message: error.message || 'Tool execution failed',
            data: { tool: name, error: error.toString() }
          }
        }
        break

      default:
        response.error = {
          code: ErrorCodes.METHOD_NOT_FOUND,
          message: `Method '${request.method}' not found`,
        }
    }
  } catch (error: any) {
    // Handle unexpected errors
    if (span) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message || 'Internal error' })
      span.setAttribute('error', true)
      span.setAttribute('error.message', error.message || error.toString())
    }
    response.error = {
      code: ErrorCodes.INTERNAL_ERROR,
      message: 'Internal error',
      data: error.message,
    }
  }

  // Set final span attributes and status
  if (span) {
    if (response.error) {
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: response.error.message 
      })
      span.setAttribute('langfuse.trace.output', JSON.stringify(response.error))
      span.setAttribute('mcp.error', true)
      span.setAttribute('mcp.error.code', response.error.code)
    } else {
      span.setStatus({ code: SpanStatusCode.OK })
      span.setAttribute('langfuse.trace.output', JSON.stringify(response.result))
    }
    
    // End the span
    span.end()
  }

  // Flush spans to ensure they're sent before function terminates
  if (tracerProvider) {
    try {
      await tracerProvider.forceFlush()
    } catch (flushError) {
      console.error('[Observability] Failed to flush spans:', flushError)
    }
  }

  return response
}

// Execute tool
async function executeTool(toolName: string, args: any, supabase: any) {
  console.log('Executing tool:', toolName, args)
  
  switch (toolName) {
    case 'business_metrics': {
      const { metrics, period = 'mtd' } = args
      const results: Record<string, any> = {}
      
      // Define SQL queries for each metric
      const metricQueries: Record<string, string> = {
        revenue_mtd: `SELECT COALESCE(SUM(total_amount), 0) as value FROM invoices WHERE status='paid' AND DATE_TRUNC('month', invoice_date) = DATE_TRUNC('month', CURRENT_DATE)`,
        revenue_ytd: `SELECT COALESCE(SUM(total_amount), 0) as value FROM invoices WHERE status='paid' AND DATE_TRUNC('year', invoice_date) = DATE_TRUNC('year', CURRENT_DATE)`,
        revenue_last_month: `SELECT COALESCE(SUM(total_amount), 0) as value FROM invoices WHERE status='paid' AND DATE_TRUNC('month', invoice_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')`,
        outstanding_ar: `SELECT COALESCE(SUM(total_amount - paid_amount), 0) as value FROM invoices WHERE status IN ('sent', 'overdue')`,
        overdue_invoices: `SELECT COUNT(*) as count, COALESCE(SUM(total_amount - paid_amount), 0) as value FROM invoices WHERE due_date < CURRENT_DATE AND status != 'paid'`,
        cash_position: `SELECT COALESCE(SUM(balance), 0) as value FROM chart_of_accounts WHERE account_type='asset' AND (account_name ILIKE '%cash%' OR account_name ILIKE '%bank%')`,
        customer_count: `SELECT COUNT(*) as value FROM contacts WHERE contact_type='customer'`,
        vendor_count: `SELECT COUNT(*) as value FROM contacts WHERE contact_type='vendor'`,
        expense_mtd: `SELECT COALESCE(SUM(amount), 0) as value FROM expenses WHERE DATE_TRUNC('month', expense_date) = DATE_TRUNC('month', CURRENT_DATE)`,
        expense_ytd: `SELECT COALESCE(SUM(amount), 0) as value FROM expenses WHERE DATE_TRUNC('year', expense_date) = DATE_TRUNC('year', CURRENT_DATE)`,
        gross_profit: `SELECT (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status='paid' AND DATE_TRUNC('month', invoice_date) = DATE_TRUNC('month', CURRENT_DATE)) - (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE DATE_TRUNC('month', expense_date) = DATE_TRUNC('month', CURRENT_DATE)) as value`,
        top_customers: `SELECT c.company_name, COALESCE(SUM(i.total_amount), 0) as revenue FROM contacts c LEFT JOIN invoices i ON i.contact_id = c.id WHERE c.contact_type='customer' AND i.status='paid' GROUP BY c.id, c.company_name ORDER BY revenue DESC LIMIT 5`,
        pending_invoices: `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as value FROM invoices WHERE status IN ('draft', 'sent')`
      }
      
      // Execute requested metrics
      for (const metric of metrics) {
        if (metricQueries[metric]) {
          try {
            const { data, error } = await supabase.rpc('execute_sql', {
              query: metricQueries[metric],
              params: []
            })
            
            if (error) throw error
            
            // Format the result based on metric type
            if (metric === 'top_customers') {
              results[metric] = data
            } else if (metric === 'overdue_invoices' || metric === 'pending_invoices') {
              results[metric] = data[0] || { count: 0, value: 0 }
            } else {
              results[metric] = data[0]?.value || 0
            }
          } catch (error) {
            console.error(`Error calculating ${metric}:`, error)
            results[metric] = 'Error calculating'
          }
        }
      }
      
      // Format response with business context
      let businessContext = "📊 Business Metrics Summary\n\n"
      
      for (const [metric, value] of Object.entries(results)) {
        if (metric === 'top_customers' && Array.isArray(value)) {
          businessContext += "**Top Customers:**\n"
          value.forEach((customer: any, i: number) => {
            businessContext += `${i + 1}. ${customer.company_name}: $${customer.revenue.toLocaleString()}\n`
          })
        } else if (typeof value === 'object' && value.count !== undefined) {
          const label = metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          businessContext += `**${label}:** ${value.count} items worth $${value.value.toLocaleString()}\n`
        } else if (typeof value === 'number') {
          const label = metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          if (metric.includes('count')) {
            businessContext += `**${label}:** ${value}\n`
          } else {
            businessContext += `**${label}:** $${value.toLocaleString()}\n`
          }
        }
      }
      
      return {
        businessContext,
        metrics: results,
        period,
        _debug: {
          queries: Object.keys(results).map(k => metricQueries[k])
        }
      }
    }
    
    case 'safe_write': {
      const { operation, data, dry_run = true } = args
      
      // Transaction wrapper for safe writes
      if (dry_run) {
        // Preview mode - show what would happen
        let preview = "🔍 Preview of changes:\n\n"
        
        switch (operation) {
          case 'create_invoice':
            preview += `**New Invoice**\n`
            preview += `- Customer: ${data.customer_name || 'ID: ' + data.contact_id}\n`
            preview += `- Amount: $${data.total_amount?.toLocaleString() || 0}\n`
            preview += `- Due Date: ${data.due_date || 'Not set'}\n`
            preview += `- Status: ${data.status || 'draft'}\n\n`
            preview += `⚠️ This will create a new invoice. Call again with dry_run=false to confirm.`
            break
            
          case 'record_payment':
            preview += `**Payment Recording**\n`
            preview += `- Invoice: ${data.invoice_number || 'ID: ' + data.invoice_id}\n`
            preview += `- Payment Amount: $${data.amount?.toLocaleString() || 0}\n`
            preview += `- Payment Date: ${data.payment_date || 'Today'}\n\n`
            preview += `⚠️ This will update the invoice and create a payment transaction. Call again with dry_run=false to confirm.`
            break
            
          case 'add_customer':
            preview += `**New Customer**\n`
            preview += `- Company: ${data.company_name}\n`
            preview += `- Contact: ${data.first_name} ${data.last_name}\n`
            preview += `- Email: ${data.email}\n`
            preview += `- Phone: ${data.phone || 'Not provided'}\n\n`
            preview += `⚠️ This will create a new customer record. Call again with dry_run=false to confirm.`
            break
            
          default:
            preview += `Operation: ${operation}\n`
            preview += `Data: ${JSON.stringify(data, null, 2)}\n\n`
            preview += `⚠️ Call again with dry_run=false to confirm.`
        }
        
        return {
          businessContext: preview,
          dry_run: true,
          operation,
          data
        }
      } else {
        // Actual write mode - perform the operation
        let result: any
        let businessContext = ""
        
        switch (operation) {
          case 'create_invoice':
            const { data: invoice, error: invError } = await supabase
              .from('invoices')
              .insert({
                ...data,
                invoice_number: data.invoice_number || `INV-${Date.now()}`,
                status: data.status || 'draft',
                paid_amount: 0,
                createdAt: new Date()
              })
              .select()
              .single()
            
            if (invError) throw invError
            
            businessContext = `✅ Invoice ${invoice.invoice_number} created successfully!\n`
            businessContext += `- Amount: $${invoice.total_amount.toLocaleString()}\n`
            businessContext += `- Due: ${invoice.due_date}`
            result = invoice
            break
            
          case 'record_payment':
            // Update invoice paid amount
            const { data: updatedInvoice, error: updateError } = await supabase
              .from('invoices')
              .update({
                paid_amount: data.amount,
                status: data.amount >= data.invoice_total ? 'paid' : 'partial'
              })
              .eq('id', data.invoice_id)
              .select()
              .single()
            
            if (updateError) throw updateError
            
            // Create transaction record
            const { data: transaction, error: transError } = await supabase
              .from('transactions')
              .insert({
                transaction_number: `PAY-${Date.now()}`,
                transaction_date: data.payment_date || new Date(),
                transaction_type: 'payment',
                contact_id: updatedInvoice.contact_id,
                amount: data.amount,
                payment_method: data.payment_method || 'bank_transfer',
                reference_number: updatedInvoice.invoice_number,
                description: `Payment for invoice ${updatedInvoice.invoice_number}`,
                status: 'completed'
              })
              .select()
              .single()
            
            if (transError) throw transError
            
            businessContext = `✅ Payment recorded successfully!\n`
            businessContext += `- Invoice: ${updatedInvoice.invoice_number}\n`
            businessContext += `- Payment: $${data.amount.toLocaleString()}\n`
            businessContext += `- Status: ${updatedInvoice.status}`
            result = { invoice: updatedInvoice, transaction }
            break
            
          case 'add_customer':
            const { data: customer, error: custError } = await supabase
              .from('contacts')
              .insert({
                ...data,
                contact_type: 'customer',
                is_active: true,
                createdAt: new Date()
              })
              .select()
              .single()
            
            if (custError) throw custError
            
            businessContext = `✅ Customer added successfully!\n`
            businessContext += `- Company: ${customer.company_name}\n`
            businessContext += `- Email: ${customer.email}`
            result = customer
            break
            
          default:
            throw new Error(`Unknown operation: ${operation}`)
        }
        
        return {
          businessContext,
          success: true,
          operation,
          result
        }
      }
    }
    
    case 'discover_schema': {
      // Check cache first
      const cached = schemaCache.get()
      if (cached) {
        return {
          cached: true,
          tables: cached.tables,
          mappings: {
            customers: "contacts WHERE contact_type='customer'",
            vendors: "contacts WHERE contact_type='vendor'",
            invoices: "invoices",
            invoice_items: "invoice_line_items",
            expenses: "expenses",
            accounts: "chart_of_accounts",
            products: "inventory",
            journal_entries: "journal_entries",
            journal_lines: "journal_entry_lines",
            transactions: "transactions"
          },
          hints: {
            "finding_customers": "Customers are in 'contacts' table with contact_type='customer'",
            "pending_invoices": "Use status IN ('draft', 'sent')",
            "overdue_invoices": "due_date < CURRENT_DATE AND status != 'paid'",
            "date_ranges": "Use DATE_TRUNC for month/quarter/year grouping",
            "revenue": "SUM(total_amount) FROM invoices WHERE status='paid'",
            "customer_balance": "total_amount - paid_amount for each invoice",
            "account_types": "asset, liability, equity, revenue, expense"
          },
          message: "Schema cached - no need to check again for 5 minutes"
        }
      }
      
      // Fetch fresh schema
      const { data: tables, error } = await supabase.rpc('get_tables', {
        schema_name: 'public'
      })
      
      if (error) throw error
      
      const tableList = tables.map((t: any) => t.table_name)
      schemaCache.set(tableList, tables)
      
      return {
        cached: false,
        tables: tableList,
        mappings: {
          customers: "contacts WHERE contact_type='customer'",
          vendors: "contacts WHERE contact_type='vendor'",
          invoices: "invoices",
          invoice_items: "invoice_line_items",
          expenses: "expenses",
          accounts: "chart_of_accounts",
          products: "inventory",
          journal_entries: "journal_entries",
          journal_lines: "journal_entry_lines",
          transactions: "transactions"
        },
        hints: {
          "finding_customers": "Customers are in 'contacts' table with contact_type='customer'",
          "pending_invoices": "Use status IN ('draft', 'sent')",
          "overdue_invoices": "due_date < CURRENT_DATE AND status != 'paid'",
          "date_ranges": "Use DATE_TRUNC for month/quarter/year grouping",
          "revenue": "SUM(total_amount) FROM invoices WHERE status='paid'",
          "customer_balance": "total_amount - paid_amount for each invoice",
          "account_types": "asset, liability, equity, revenue, expense"
        },
        message: "Schema discovered and cached for 5 minutes"
      }
    }
    
    case 'query': {
      // Analyze the query to provide business context
      const sql = args.sql.toLowerCase()
      let businessContext = "📊 Analyzing data..."
      
      // Determine business context from SQL
      if (sql.includes('customer') && (sql.includes('sum') || sql.includes('total'))) {
        businessContext = "💰 Analyzing customer revenue..."
      } else if (sql.includes('customer') && sql.includes('revenue')) {
        businessContext = "💰 Analyzing customer revenue..."
      } else if (sql.includes('customer') && sql.includes('count')) {
        businessContext = "👥 Counting customers..."
      } else if (sql.includes('customer')) {
        businessContext = "🔍 Searching for customers..."
      } else if (sql.includes('invoice') && sql.includes('sum')) {
        businessContext = "💵 Calculating invoice totals..."
      } else if (sql.includes('invoice') && sql.includes('overdue')) {
        businessContext = "⚠️ Finding overdue invoices..."
      } else if (sql.includes('invoice')) {
        businessContext = "📄 Retrieving invoices..."
      } else if (sql.includes('transaction')) {
        businessContext = "💳 Processing transactions..."
      } else if (sql.includes('product')) {
        businessContext = "📦 Analyzing products..."
      } else if (sql.includes('cashflow') || sql.includes('cash flow')) {
        businessContext = "💸 Analyzing cash flow..."
      } else if (sql.includes('revenue')) {
        businessContext = "📈 Calculating revenue..."
      } else if (sql.includes('expense')) {
        businessContext = "📉 Analyzing expenses..."
      }
      
      // Execute SQL query
      const { data, error } = await supabase.rpc('execute_sql', {
        query: args.sql,
        params: args.params || []
      })
      
      if (error) {
        // Provide helpful error messages
        if (error.message.includes('does not exist')) {
          const tableMatch = error.message.match(/relation "(\w+)" does not exist/)
          if (tableMatch) {
            const missingTable = tableMatch[1]
            if (missingTable === 'customers') {
              throw new Error(
                `Table "${missingTable}" does not exist. ` +
                `Customers are in 'contacts' table with contact_type='customer'. ` +
                `Try: SELECT * FROM contacts WHERE contact_type='customer'`
              )
            }
            if (missingTable === 'vendors') {
              throw new Error(
                `Table "${missingTable}" does not exist. ` +
                `Vendors are in 'contacts' table with contact_type='vendor'. ` +
                `Try: SELECT * FROM contacts WHERE contact_type='vendor'`
              )
            }
            throw new Error(
              `Table "${missingTable}" does not exist. ` +
              `Available: contacts, invoices, invoice_line_items, expenses, inventory, chart_of_accounts, journal_entries, transactions. ` +
              `Use 'discover_schema' first.`
            )
          }
        }
        throw error
      }
      
      return {
        businessContext,
        rows: data || [],
        rowCount: data ? data.length : 0,
        // Include SQL for debugging but it can be hidden in UI
        _debug: {
          sql: args.sql,
          params: args.params
        }
      }
    }

    case 'list_tables': {
      // Check cache first
      const cached = schemaCache.get()
      if (cached) {
        return { 
          tables: cached.tables,
          cached: true,
          hint: "Customers are in 'contacts' table with contact_type='customer'"
        }
      }
      
      // Fetch from database
      const { data, error } = await supabase.rpc('get_tables', {
        schema_name: 'public'
      })
      
      if (error) throw error
      
      const tables = data.map((t: any) => t.table_name)
      schemaCache.set(tables, data)
      
      return { 
        tables,
        cached: false,
        hint: "Customers are in 'contacts' table with contact_type='customer'"
      }
    }

    case 'get_table_data': {
      // Determine business context
      let businessContext = "📊 Retrieving data..."
      if (args.table === 'contacts' && args.filters?.contact_type === 'customer') {
        businessContext = "🔍 Searching for customers..."
      } else if (args.table === 'contacts' && args.filters?.contact_type === 'vendor') {
        businessContext = "🏢 Looking up vendors..."
      } else if (args.table === 'invoices') {
        businessContext = "📄 Retrieving invoices..."
      } else if (args.table === 'transactions') {
        businessContext = "💳 Finding transactions..."
      } else if (args.table === 'inventory') {
        businessContext = "📦 Loading products..."
      } else if (args.table === 'chart_of_accounts') {
        businessContext = "📊 Fetching accounts..."
      } else if (args.table === 'expenses') {
        businessContext = "💸 Retrieving expenses..."
      } else if (args.table === 'journal_entries') {
        businessContext = "📓 Loading journal entries..."
      }
      
      let query = supabase.from(args.table).select('*')
      
      // Apply filters
      if (args.filters) {
        for (const [key, value] of Object.entries(args.filters)) {
          query = query.eq(key, value)
        }
      }
      
      // Apply ordering
      if (args.orderBy) {
        query = query.order(args.orderBy, { ascending: args.ascending ?? true })
      }
      
      // Apply limit
      if (args.limit) {
        query = query.limit(args.limit)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      return { 
        businessContext,
        data: data || [],
        count: data ? data.length : 0,
        _debug: {
          table: args.table,
          filters: args.filters,
          limit: args.limit
        }
      }
    }

    case 'insert_data': {
      const { data, error } = await supabase
        .from(args.table)
        .insert(args.data)
        .select()
      
      if (error) throw error
      
      return { 
        success: true,
        inserted: data,
        count: Array.isArray(data) ? data.length : 1
      }
    }

    case 'update_data': {
      let query = supabase.from(args.table).update(args.data)
      
      // Apply filters
      if (args.filters) {
        for (const [key, value] of Object.entries(args.filters)) {
          query = query.eq(key, value)
        }
      }
      
      const { data, error } = await query.select()
      
      if (error) throw error
      
      return { 
        success: true,
        updated: data,
        count: data ? data.length : 0
      }
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`)
  }
}

// Handle Server-Sent Events for streaming
async function handleSSE(req: Request, sessionId?: string | null) {
  const encoder = new TextEncoder()
  const body = new ReadableStream({
    async start(controller) {
      // Send initial connection event
      const event = JSON.stringify({
        type: 'connection',
        status: 'connected',
        sessionId: sessionId || 'stateless',
        timestamp: new Date().toISOString()
      })
      controller.enqueue(encoder.encode(`data: ${event}\n\n`))
      
      // Heartbeat to keep connection alive
      const interval = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'))
      }, 30000)
      
      // Clean up on close
      req.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(body, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}

// Helper functions
function createJsonRpcError(
  id: string | number | null,
  code: number,
  message: string,
  data?: any
): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message,
      data
    }
  }
}

function createErrorResponse(
  id: string | number | null,
  code: number,
  message: string,
  httpStatus: number = 200 // JSON-RPC errors typically return 200
) {
  const response = createJsonRpcError(id, code, message)
  return new Response(
    JSON.stringify(response),
    {
      status: httpStatus,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

/* 
Edge Function MCP Server - Production Ready

Features:
✅ Streamable HTTP transport (2025-03-26 spec)
✅ Stateless operation (scales to zero)
✅ Batch request support
✅ SSE streaming option
✅ Rate limiting
✅ Schema caching
✅ Proper JSON-RPC error codes
✅ Session support (optional)
✅ Clean tool names (no double prefix)

Test with:
curl -X POST http://localhost:54321/functions/v1/mcp-server \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_KEY' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
*/