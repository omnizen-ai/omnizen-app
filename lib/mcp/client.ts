import { experimental_createMCPClient, type Tool } from 'ai';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export interface MCPConfig {
  enabled?: boolean;
  url: string;
  headers?: Record<string, string>;
}

export class MCPClient {
  private static instance: MCPClient | null = null;
  private clients: Map<string, Awaited<ReturnType<typeof experimental_createMCPClient>>> = new Map();
  private isInitialized = false;

  private constructor() {}

  static getInstance(): MCPClient {
    if (!MCPClient.instance) {
      MCPClient.instance = new MCPClient();
    }
    return MCPClient.instance;
  }

  async initialize(config?: { [name: string]: MCPConfig }): Promise<void> {
    if (this.isInitialized) return;

    // Default configuration for Supabase MCP server
    const defaultConfig: { [name: string]: MCPConfig } = {
      supabase: {
        enabled: true,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL 
          ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/database-mcp-supabase`
          : 'http://127.0.0.1:54321/functions/v1/database-mcp-supabase',
        headers: process.env.SUPABASE_SERVICE_ROLE_KEY
          ? {
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
            }
          : undefined,
      },
    };

    const finalConfig = config || defaultConfig;

    for (const [name, mcpConfig] of Object.entries(finalConfig)) {
      if (mcpConfig.enabled === false) {
        console.log(`MCP server ${name} is disabled`);
        continue;
      }

      try {
        console.log(`Connecting to MCP server ${name} at ${mcpConfig.url}`);
        
        const transport = new StreamableHTTPClientTransport(
          new URL(mcpConfig.url),
          {
            requestInit: {
              headers: mcpConfig.headers,
            },
          }
        );

        const client = await experimental_createMCPClient({
          transport,
        });

        this.clients.set(name, client);
        console.log(`Successfully connected to MCP server ${name}`);
      } catch (error) {
        console.error(`Failed to connect to MCP server ${name}:`, error);
        // Continue with other servers even if one fails
      }
    }

    this.isInitialized = true;
  }

  async getTools(): Promise<Record<string, Tool>> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const result: Record<string, Tool> = {};

    for (const [clientName, client] of this.clients.entries()) {
      try {
        const clientTools = await client.tools();
        console.log(`Tools from ${clientName}:`, Object.keys(clientTools));
        
        for (const [toolName, tool] of Object.entries(clientTools)) {
          // Sanitize names for use as tool IDs
          const sanitizedClientName = clientName.replace(/\s+/g, '_');
          const sanitizedToolName = toolName.replace(/[-\s]+/g, '_');
          
          // Use a naming convention that's compatible with the AI SDK
          const toolId = clientName === 'supabase'
            ? `db_${sanitizedToolName}`  // Prefix database tools
            : `${sanitizedClientName}_${sanitizedToolName}`;
          
          // The MCP tools from experimental_createMCPClient are already in the correct format
          // They have description, inputSchema, and execute properties
          result[toolId] = tool as Tool;
        }
      } catch (error) {
        console.error(`Failed to get tools from MCP server ${clientName}:`, error);
      }
    }

    return result;
  }

  async close(): Promise<void> {
    for (const [name, client] of this.clients.entries()) {
      try {
        await client.close();
        console.log(`Closed connection to MCP server ${name}`);
      } catch (error) {
        console.error(`Failed to close MCP server ${name}:`, error);
      }
    }
    this.clients.clear();
    this.isInitialized = false;
  }

  isConnected(): boolean {
    return this.isInitialized && this.clients.size > 0;
  }

  getConnectedServers(): string[] {
    return Array.from(this.clients.keys());
  }
}

// Export singleton instance
export const mcpClient = MCPClient.getInstance();