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
    name: 'discover_schema',
    description: 'Discover business data structure. REQUIRED: Output "Let me check what business information is available..." or similar BEFORE invoking. NEVER mention database, tables, SQL, or tool names to users.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'query',
    description: 'Retrieve business data. REQUIRED: Output a contextual message BEFORE invoking, e.g. "Searching for customers...", "Calculating revenue...", "Analyzing cash flow...". NEVER mention SQL, queries, or technical terms.',
    inputSchema: {
      type: 'object',
      properties: {
        sql: {
          type: 'string',
          description: 'SQL query (internal use only - never show to user)'
        },
      },
      required: ['sql'],
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
          instructions: 'You are a business operations assistant. REQUIRED: Always output a business-friendly action message BEFORE invoking any tool (e.g., "Let me search for your customers...", "Calculating revenue trends..."). Use business terms only. Never mention SQL, database, tables, queries, or technical terms. Instead use: customers, invoices, revenue, products, business data. Be conversational and business-focused.',
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
    case 'discover_schema': {
      // Check cache first
      const cached = schemaCache.get()
      if (cached) {
        return {
          cached: true,
          tables: cached.tables,
          mappings: {
            customers: "entities WHERE type='customer'",
            vendors: "entities WHERE type='vendor'",
            invoices: "transactions WHERE type='invoice'",
            bills: "transactions WHERE type='bill'",
            payments: "transactions WHERE type='payment'",
            accounts: "accounts",
            products: "products"
          },
          hints: {
            "finding_customers": "Customers are in 'entities' table with type='customer'",
            "pending_items": "Use status IN ('pending', 'draft', 'sent')",
            "overdue_invoices": "due_date < CURRENT_DATE AND status != 'paid'",
            "date_ranges": "Use DATE_TRUNC for month/quarter/year grouping",
            "revenue": "SUM(amount) FROM transactions WHERE type='invoice' AND status='paid'"
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
          customers: "entities WHERE type='customer'",
          vendors: "entities WHERE type='vendor'",
          invoices: "transactions WHERE type='invoice'",
          bills: "transactions WHERE type='bill'",
          payments: "transactions WHERE type='payment'",
          accounts: "accounts",
          products: "products"
        },
        hints: {
          "finding_customers": "Customers are in 'entities' table with type='customer'",
          "pending_items": "Use status IN ('pending', 'draft', 'sent')",
          "overdue_invoices": "due_date < CURRENT_DATE AND status != 'paid'",
          "date_ranges": "Use DATE_TRUNC for month/quarter/year grouping",
          "revenue": "SUM(amount) FROM transactions WHERE type='invoice' AND status='paid'"
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
                `Customers are in 'entities' table with type='customer'. ` +
                `Try: SELECT * FROM entities WHERE type='customer'`
              )
            }
            throw new Error(
              `Table "${missingTable}" does not exist. ` +
              `Available: entities, transactions, accounts, products, organizations, users. ` +
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
          hint: "Customers are in 'entities' table with type='customer'"
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
        hint: "Customers are in 'entities' table with type='customer'"
      }
    }

    case 'get_table_data': {
      // Determine business context
      let businessContext = "📊 Retrieving data..."
      if (args.table === 'entities' && args.filters?.type === 'customer') {
        businessContext = "🔍 Searching for customers..."
      } else if (args.table === 'entities' && args.filters?.type === 'vendor') {
        businessContext = "🏢 Looking up vendors..."
      } else if (args.table === 'transactions' && args.filters?.type === 'invoice') {
        businessContext = "📄 Retrieving invoices..."
      } else if (args.table === 'transactions' && args.filters?.type === 'payment') {
        businessContext = "💳 Finding payments..."
      } else if (args.table === 'products') {
        businessContext = "📦 Loading products..."
      } else if (args.table === 'accounts') {
        businessContext = "📊 Fetching accounts..."
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