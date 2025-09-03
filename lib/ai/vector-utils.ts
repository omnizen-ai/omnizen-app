/**
 * Vector utilities for pgvector operations
 * Handles embedding generation, similarity search, and vector operations
 */

// AI SDK imports will be added when used
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export interface EmbeddingOptions {
  model?: 'text-embedding-3-small' | 'text-embedding-3-large' | 'text-embedding-ada-002';
  dimensions?: number; // For text-embedding-3 models
}

export interface SimilarityResult {
  id: string;
  content: string;
  similarity: number;
  metadata?: any;
}

/**
 * Vector service for embedding generation and similarity operations
 */
export class VectorService {
  private readonly defaultModel = 'text-embedding-3-small';
  private readonly defaultDimensions = 1536;

  /**
   * Generate embedding for text using OpenAI
   */
  async generateEmbedding(
    text: string, 
    options: EmbeddingOptions = {}
  ): Promise<number[]> {
    if (!text?.trim()) {
      throw new Error('Text cannot be empty for embedding generation');
    }

    try {
      // Use OpenAI directly for embeddings
      const { OpenAI } = await import('openai');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      
      const response = await openai.embeddings.create({
        model: options.model || this.defaultModel,
        input: text.trim(),
        ...(options.dimensions && { dimensions: options.dimensions })
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Embedding generation failed:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Generate smaller embeddings optimized for SQL query domain
   */
  async generateQueryEmbedding(
    intent: string,
    userQuery: string,
    context?: {
      orgName?: string;
      role?: string;
      domain?: string;
    }
  ): Promise<number[]> {
    // Build rich context for query embeddings
    const embeddingText = [
      `Intent: ${intent}`,
      `Query: ${userQuery}`,
      context?.orgName && `Organization: ${context.orgName}`,
      context?.role && `Role: ${context.role}`,  
      context?.domain && `Domain: ${context.domain}`
    ].filter(Boolean).join('\n');

    return this.generateEmbedding(embeddingText, { 
      dimensions: 256  // Smaller for query domain optimization
    });
  }

  /**
   * Generate document embeddings with metadata context
   */
  async generateDocumentEmbedding(
    content: string,
    metadata?: {
      title?: string;
      documentType?: string;
      category?: string;
    }
  ): Promise<number[]> {
    // Build rich context for document embeddings
    const embeddingText = [
      metadata?.title && `Title: ${metadata.title}`,
      metadata?.documentType && `Type: ${metadata.documentType}`,
      metadata?.category && `Category: ${metadata.category}`,
      `Content: ${content}`
    ].filter(Boolean).join('\n');

    return this.generateEmbedding(embeddingText, {
      dimensions: 1536  // Full dimensions for document search
    });
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Find similar vectors using pgvector cosine distance
   */
  async findSimilarVectors<T>(
    table: string,
    embeddingColumn: string,
    queryEmbedding: number[],
    options: {
      threshold?: number;
      limit?: number;
      organizationId?: string;
      additionalFilters?: any;
    } = {}
  ): Promise<T[]> {
    const {
      threshold = 0.7,
      limit = 10,
      organizationId,
      additionalFilters = {}
    } = options;

    try {
      // Build the similarity query using pgvector operations
      // Note: vector operations are in the vectors schema
      const vectorString = `[${queryEmbedding.join(',')}]`;
      let query = sql`
        SELECT *,
          1 - (${sql.identifier(embeddingColumn)} <=> ${vectorString}::vectors.vector) as similarity
        FROM ${sql.identifier(table)}
        WHERE 1 - (${sql.identifier(embeddingColumn)} <=> ${vectorString}::vectors.vector) > ${threshold}
      `;

      // Add organization filter if provided
      if (organizationId) {
        query = sql`${query} AND organization_id = ${organizationId}`;
      }

      // Add additional filters
      for (const [key, value] of Object.entries(additionalFilters)) {
        query = sql`${query} AND ${sql.identifier(key)} = ${value}`;
      }

      // Order by similarity and limit
      query = sql`${query} ORDER BY similarity DESC LIMIT ${limit}`;

      const results = await db.execute(query);
      return results.rows as T[];
    } catch (error) {
      console.error('Vector similarity search failed:', error);
      throw new Error(`Failed to find similar vectors: ${error.message}`);
    }
  }

  /**
   * Batch generate embeddings for multiple texts
   */
  async generateBatchEmbeddings(
    texts: string[],
    options: EmbeddingOptions = {}
  ): Promise<number[][]> {
    if (!texts.length) return [];

    // Process in batches to avoid rate limits
    const batchSize = 10;
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchPromises = batch.map(text => this.generateEmbedding(text, options));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Small delay to avoid rate limiting
        if (i + batchSize < texts.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Batch embedding failed for batch ${i}-${i + batchSize}:`, error);
        throw error;
      }
    }

    return results;
  }

  /**
   * Create vector index for performance optimization
   */
  async createVectorIndex(
    table: string,
    embeddingColumn: string,
    indexType: 'ivfflat' | 'hnsw' = 'ivfflat',
    options: {
      lists?: number; // For IVFFlat
      m?: number;     // For HNSW
      efConstruction?: number; // For HNSW
    } = {}
  ): Promise<void> {
    try {
      let indexOptions = '';
      
      if (indexType === 'ivfflat') {
        const lists = options.lists || Math.max(Math.floor(1000 / 10), 10); // Rough estimate
        indexOptions = `WITH (lists = ${lists})`;
      } else if (indexType === 'hnsw') {
        const m = options.m || 16;
        const efConstruction = options.efConstruction || 64;
        indexOptions = `WITH (m = ${m}, ef_construction = ${efConstruction})`;
      }

      const indexName = `idx_${table}_${embeddingColumn}_${indexType}`;
      
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS ${sql.identifier(indexName)}
        ON ${sql.identifier(table)}
        USING ${sql.raw(indexType)} (${sql.identifier(embeddingColumn)} vectors.vector_cosine_ops)
        ${sql.raw(indexOptions)}
      `);

      console.log(`Vector index ${indexName} created successfully`);
    } catch (error) {
      console.error(`Failed to create vector index:`, error);
      throw error;
    }
  }

  /**
   * Validate vector dimensions
   */
  validateVector(vector: number[], expectedDimensions: number): boolean {
    return Array.isArray(vector) && 
           vector.length === expectedDimensions &&
           vector.every(val => typeof val === 'number' && !isNaN(val));
  }

  /**
   * Search for similar content using vector similarity
   * This method provides a more specific interface for similarity search
   */
  async searchSimilar<T>(
    content: string,
    options: {
      table?: string;
      embeddingColumn?: string;
      threshold?: number;
      limit?: number;
      organizationId?: string;
      filters?: Record<string, any>;
    } = {}
  ): Promise<SimilarityResult[]> {
    const {
      table = 'document_embeddings',
      embeddingColumn = 'embedding',
      threshold = 0.7,
      limit = 10,
      organizationId,
      filters = {}
    } = options;

    // Generate embedding for the search content
    const queryEmbedding = await this.generateEmbedding(content);
    
    // Use the existing findSimilarVectors method
    const results = await this.findSimilarVectors<any>(
      table,
      embeddingColumn,
      queryEmbedding,
      {
        threshold,
        limit,
        organizationId,
        additionalFilters: filters
      }
    );

    // Transform results to SimilarityResult format
    return results.map(row => ({
      id: row.id,
      content: row.content || row.extracted_text || '',
      similarity: row.similarity,
      metadata: row.metadata || {}
    }));
  }

  /**
   * Generate a hash for content deduplication
   */
  async hashContent(content: string): Promise<string> {
    // Use Node.js crypto to generate a consistent hash
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(content.trim()).digest('hex');
  }
}

// Export singleton instance
export const vectorService = new VectorService();

// Helper functions for common operations
export async function generateEmbedding(text: string, options?: EmbeddingOptions): Promise<number[]> {
  return vectorService.generateEmbedding(text, options);
}

export async function findSimilarDocuments<T>(
  queryEmbedding: number[],
  organizationId?: string,
  options?: { threshold?: number; limit?: number }
): Promise<T[]> {
  return vectorService.findSimilarVectors(
    'document_embeddings',
    'embedding', 
    queryEmbedding,
    { ...options, organizationId }
  );
}

export async function findSimilarQueries<T>(
  queryEmbedding: number[],
  organizationId?: string,
  options?: { threshold?: number; limit?: number }
): Promise<T[]> {
  return vectorService.findSimilarVectors(
    'query_intelligence',
    'embedding',
    queryEmbedding, 
    { ...options, organizationId }
  );
}