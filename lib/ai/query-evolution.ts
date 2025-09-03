import { db } from '@/lib/db';
import { 
  queryIntelligence, 
  queryEvolution, 
  queryBatchJobs, 
  queryPatterns,
  queryFeedback,
  type QueryIntelligence 
} from '@/lib/db/schema/ai/query-intelligence';
import { VectorService } from './vector-utils';
import { eq, and, desc, gt, lt, sql, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import Redis from 'ioredis';

export interface BatchProcessingConfig {
  batchSize?: number;
  minExecutionCount?: number;
  similarityThreshold?: number;
  embeddingModel?: string;
  maxProcessingTime?: number;
}

export interface QueryPattern {
  queryHash: string;
  queryPattern: string;
  originalQuery: string;
  userPrompt?: string;
  intent: 'read' | 'write' | 'analyze' | 'search' | 'report' | 'admin' | 'unknown';
  complexity: 'simple' | 'moderate' | 'complex' | 'advanced';
  tablesUsed: string[];
  executionCount: number;
  totalExecutionTime: number;
  metadata: Record<string, any>;
}

export interface EvolutionResult {
  parentQueryId: string;
  adaptationReason: string;
  contextSimilarity: number;
  queryModifications: any[];
  executionSuccess: boolean;
  executionTime?: number;
}

/**
 * Query Evolution Service - Implements batch processing and evolutionary learning
 * Processes queries from Redis cache in batches for maximum efficiency
 */
export class QueryEvolutionService {
  private vectorService: VectorService;
  private redis: Redis;

  constructor(redisUrl?: string) {
    this.vectorService = new VectorService();
    this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');
  }

  /**
   * Main batch processing entry point - processes Redis queries in batches
   */
  async processBatch(
    organizationId: string,
    config: BatchProcessingConfig = {}
  ): Promise<string> {
    const defaultConfig: Required<BatchProcessingConfig> = {
      batchSize: 100,
      minExecutionCount: 2,
      similarityThreshold: 0.8,
      embeddingModel: 'text-embedding-3-small',
      maxProcessingTime: 30000, // 30 seconds
    };

    const finalConfig = { ...defaultConfig, ...config };
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    try {
      // Create batch job record
      const [batchJob] = await db.insert(queryBatchJobs).values({
        id: uuidv4(),
        organizationId,
        batchId,
        totalQueries: 0,
        config: finalConfig,
        triggerReason: 'manual',
        startedAt: new Date(),
      }).returning();

      console.log(`[QueryEvolution] Started batch processing: ${batchId}`);

      // Step 1: Collect queries from Redis
      const redisQueries = await this.collectQueriesFromRedis(organizationId, finalConfig.batchSize);
      console.log(`[QueryEvolution] Collected ${redisQueries.length} queries from Redis`);

      if (redisQueries.length === 0) {
        await this.completeBatchJob(batchJob.id, {
          totalQueries: 0,
          processedQueries: 0,
          message: 'No queries found in Redis cache'
        });
        return batchId;
      }

      // Update total queries count
      await db.update(queryBatchJobs)
        .set({ 
          totalQueries: redisQueries.length,
          status: 'processing' 
        })
        .where(eq(queryBatchJobs.id, batchJob.id));

      // Step 2: Normalize and deduplicate queries
      const normalizedQueries = await this.normalizeQueries(redisQueries);
      console.log(`[QueryEvolution] Normalized to ${normalizedQueries.length} unique patterns`);

      // Step 3: Process queries in parallel batches
      const results = await this.processQueriesInParallel(
        organizationId,
        normalizedQueries,
        finalConfig
      );

      console.log(`[QueryEvolution] Processed ${results.processed} queries, ${results.failed} failed`);

      // Step 4: Extract and store patterns
      await this.extractAndStorePatterns(organizationId, normalizedQueries);

      // Step 5: Complete batch job
      await this.completeBatchJob(batchJob.id, {
        totalQueries: redisQueries.length,
        processedQueries: results.processed,
        failedQueries: results.failed,
        results: results.details
      });

      console.log(`[QueryEvolution] Batch ${batchId} completed successfully`);
      return batchId;

    } catch (error) {
      console.error(`[QueryEvolution] Batch ${batchId} failed:`, error);
      
      // Mark batch as failed
      await db.update(queryBatchJobs)
        .set({ 
          status: 'failed',
          completedAt: new Date(),
          errors: { error: error instanceof Error ? error.message : 'Unknown error' }
        })
        .where(eq(queryBatchJobs.batchId, batchId));

      throw error;
    }
  }

  /**
   * Collect successful queries from Redis cache
   */
  private async collectQueriesFromRedis(
    organizationId: string, 
    limit: number
  ): Promise<any[]> {
    try {
      // Get query keys from Redis (assuming they're stored with a pattern)
      const keys = await this.redis.keys(`query:${organizationId}:*`);
      
      if (keys.length === 0) {
        return [];
      }

      // Get queries in batches to avoid memory issues
      const batchSize = Math.min(limit, 50);
      const queries = [];
      
      for (let i = 0; i < Math.min(keys.length, limit); i += batchSize) {
        const batchKeys = keys.slice(i, i + batchSize);
        const batchQueries = await this.redis.mget(batchKeys);
        
        for (let j = 0; j < batchQueries.length; j++) {
          const queryData = batchQueries[j];
          if (queryData) {
            try {
              const parsed = JSON.parse(queryData);
              // Only include successful queries with sufficient usage
              if (parsed.success && parsed.executionCount >= 2) {
                queries.push({
                  redisKey: batchKeys[j],
                  ...parsed
                });
              }
            } catch (parseError) {
              console.warn(`Failed to parse query data for key ${batchKeys[j]}:`, parseError);
            }
          }
        }
      }

      return queries;
    } catch (error) {
      console.error('Error collecting queries from Redis:', error);
      return [];
    }
  }

  /**
   * Normalize queries and create patterns
   */
  private async normalizeQueries(queries: any[]): Promise<QueryPattern[]> {
    const patterns = new Map<string, QueryPattern>();

    for (const query of queries) {
      try {
        // Normalize the SQL query
        const normalizedQuery = this.normalizeSQL(query.query || query.sql);
        const queryHash = this.hashQuery(normalizedQuery);

        // Extract metadata
        const intent = this.classifyQueryIntent(normalizedQuery);
        const complexity = this.assessQueryComplexity(normalizedQuery);
        const tablesUsed = this.extractTables(normalizedQuery);

        const pattern: QueryPattern = {
          queryHash,
          queryPattern: normalizedQuery,
          originalQuery: query.query || query.sql,
          userPrompt: query.userPrompt || query.prompt,
          intent,
          complexity,
          tablesUsed,
          executionCount: query.executionCount || 1,
          totalExecutionTime: query.totalExecutionTime || query.executionTime || 0,
          metadata: {
            redisKey: query.redisKey,
            usage: query.usage || 1,
            lastUsed: query.lastUsed || new Date().toISOString(),
            source: 'redis_batch',
            ...query.metadata
          }
        };

        // Merge with existing pattern if found
        const existing = patterns.get(queryHash);
        if (existing) {
          existing.executionCount += pattern.executionCount;
          existing.totalExecutionTime += pattern.totalExecutionTime;
          existing.metadata.sources = (existing.metadata.sources || []).concat([pattern.metadata]);
        } else {
          patterns.set(queryHash, pattern);
        }

      } catch (error) {
        console.warn('Failed to normalize query:', error);
      }
    }

    return Array.from(patterns.values());
  }

  /**
   * Process queries in parallel batches with embeddings
   */
  private async processQueriesInParallel(
    organizationId: string,
    queries: QueryPattern[],
    config: Required<BatchProcessingConfig>
  ): Promise<{ processed: number; failed: number; details: any }> {
    const batchSize = Math.min(config.batchSize / 4, 25); // Smaller batches for embedding generation
    let processed = 0;
    let failed = 0;
    const details = [];

    // Process in smaller parallel batches
    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize);
      
      try {
        const batchPromises = batch.map(query => 
          this.processSingleQuery(organizationId, query, config)
            .then(result => ({ success: true, result, query: query.queryHash }))
            .catch(error => ({ success: false, error: error.message, query: query.queryHash }))
        );

        const batchResults = await Promise.all(batchPromises);
        
        for (const result of batchResults) {
          if (result.success) {
            processed++;
          } else {
            failed++;
            console.warn(`Failed to process query ${result.query}:`, result.error);
          }
          details.push(result);
        }

        console.log(`[QueryEvolution] Processed batch ${Math.floor(i / batchSize) + 1}: ${batchResults.filter(r => r.success).length}/${batchResults.length} successful`);

      } catch (error) {
        console.error(`Failed to process batch starting at ${i}:`, error);
        failed += batch.length;
      }
    }

    return { processed, failed, details };
  }

  /**
   * Process a single query pattern
   */
  private async processSingleQuery(
    organizationId: string,
    query: QueryPattern,
    config: Required<BatchProcessingConfig>
  ): Promise<string> {
    try {
      // Check if query already exists
      const [existing] = await db
        .select()
        .from(queryIntelligence)
        .where(and(
          eq(queryIntelligence.organizationId, organizationId),
          eq(queryIntelligence.queryHash, query.queryHash)
        ))
        .limit(1);

      if (existing) {
        // Update existing query intelligence
        return await this.updateExistingQuery(existing, query);
      } else {
        // Create new query intelligence
        return await this.createNewQueryIntelligence(organizationId, query);
      }
    } catch (error) {
      console.error(`Error processing query ${query.queryHash}:`, error);
      throw error;
    }
  }

  /**
   * Create new query intelligence record with embeddings
   */
  private async createNewQueryIntelligence(
    organizationId: string,
    query: QueryPattern
  ): Promise<string> {
    const queryId = uuidv4();

    // Generate embeddings in parallel
    const [contextEmbedding, queryEmbedding] = await Promise.all([
      query.userPrompt 
        ? this.vectorService.generateEmbedding(query.userPrompt)
        : null,
      this.vectorService.generateEmbedding(query.queryPattern)
    ]);

    // Calculate average execution time
    const avgExecutionTime = query.totalExecutionTime > 0 
      ? (query.totalExecutionTime / query.executionCount).toFixed(3)
      : '0.000';

    await db.insert(queryIntelligence).values({
      id: queryId,
      organizationId,
      queryHash: query.queryHash,
      queryPattern: query.queryPattern,
      originalQuery: query.originalQuery,
      intent: query.intent,
      complexity: query.complexity,
      tablesUsed: query.tablesUsed,
      userPrompt: query.userPrompt,
      contextEmbedding,
      queryEmbedding,
      executionCount: query.executionCount,
      totalExecutionTime: query.totalExecutionTime,
      avgExecutionTime,
      metadata: query.metadata,
      lastUsed: new Date(),
    });

    return queryId;
  }

  /**
   * Update existing query intelligence
   */
  private async updateExistingQuery(
    existing: any,
    query: QueryPattern
  ): Promise<string> {
    const newExecutionCount = existing.executionCount + query.executionCount;
    const newTotalTime = existing.totalExecutionTime + query.totalExecutionTime;
    const newAvgTime = newTotalTime > 0 ? (newTotalTime / newExecutionCount).toFixed(3) : '0.000';

    await db
      .update(queryIntelligence)
      .set({
        executionCount: newExecutionCount,
        totalExecutionTime: newTotalTime,
        avgExecutionTime: newAvgTime,
        lastUsed: new Date(),
        metadata: {
          ...existing.metadata,
          batchUpdates: (existing.metadata?.batchUpdates || 0) + 1,
          lastBatchUpdate: new Date().toISOString(),
          sources: (existing.metadata?.sources || []).concat([query.metadata])
        }
      })
      .where(eq(queryIntelligence.id, existing.id));

    return existing.id;
  }

  /**
   * Extract and store reusable query patterns
   */
  private async extractAndStorePatterns(
    organizationId: string,
    queries: QueryPattern[]
  ): Promise<void> {
    // Group queries by similarity to find patterns
    const patternGroups = new Map<string, QueryPattern[]>();

    for (const query of queries) {
      // Create a pattern template by removing specific values
      const template = this.createQueryTemplate(query.queryPattern);
      const templateHash = this.hashQuery(template);

      if (!patternGroups.has(templateHash)) {
        patternGroups.set(templateHash, []);
      }
      patternGroups.get(templateHash)!.push(query);
    }

    // Store patterns that appear frequently
    const minPatternUsage = 3;
    for (const [templateHash, groupQueries] of patternGroups) {
      if (groupQueries.length >= minPatternUsage) {
        await this.storeQueryPattern(organizationId, templateHash, groupQueries);
      }
    }
  }

  /**
   * Store a reusable query pattern
   */
  private async storeQueryPattern(
    organizationId: string,
    templateHash: string,
    queries: QueryPattern[]
  ): Promise<void> {
    try {
      const template = this.createQueryTemplate(queries[0].queryPattern);
      const totalUsage = queries.reduce((sum, q) => sum + q.executionCount, 0);
      const avgPerformance = queries.reduce((sum, q) => sum + q.totalExecutionTime, 0) / totalUsage;
      
      // Extract parameters from the template
      const parameters = this.extractParameters(template);
      
      // Determine business domain
      const businessDomain = this.inferBusinessDomain(queries[0].tablesUsed);

      await db.insert(queryPatterns).values({
        id: uuidv4(),
        organizationId,
        patternName: `Pattern_${templateHash.substring(0, 8)}`,
        patternTemplate: template,
        patternDescription: `Auto-generated pattern from ${queries.length} similar queries`,
        businessDomain,
        usageCount: totalUsage,
        averagePerformance: avgPerformance.toFixed(3),
        parameters,
        derivedFrom: queries.map(q => q.queryHash),
        metadata: {
          autoGenerated: true,
          sourceQueries: queries.length,
          createdFromBatch: true,
          complexity: queries[0].complexity,
          intent: queries[0].intent
        }
      });

      console.log(`[QueryEvolution] Created pattern ${templateHash.substring(0, 8)} from ${queries.length} queries`);
    } catch (error) {
      console.warn(`Failed to store query pattern:`, error);
    }
  }

  /**
   * Complete batch processing job
   */
  private async completeBatchJob(
    jobId: string,
    results: {
      totalQueries: number;
      processedQueries: number;
      failedQueries?: number;
      results?: any;
      message?: string;
    }
  ): Promise<void> {
    await db
      .update(queryBatchJobs)
      .set({
        status: 'completed',
        processedQueries: results.processedQueries,
        failedQueries: results.failedQueries || 0,
        completedAt: new Date(),
        results: results.results || results,
      })
      .where(eq(queryBatchJobs.id, jobId));
  }

  /**
   * Get batch job status and details
   */
  async getBatchJobStatus(batchId: string) {
    const [job] = await db
      .select()
      .from(queryBatchJobs)
      .where(eq(queryBatchJobs.batchId, batchId))
      .limit(1);

    if (!job) {
      throw new Error('Batch job not found');
    }

    return {
      id: job.id,
      batchId: job.batchId,
      status: job.status,
      totalQueries: job.totalQueries,
      processedQueries: job.processedQueries,
      failedQueries: job.failedQueries,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      processingTime: job.processingTime,
      config: job.config,
      results: job.results,
      errors: job.errors,
      triggerReason: job.triggerReason,
      createdAt: job.createdAt,
    };
  }

  /**
   * Get recent batch jobs for an organization
   */
  async getRecentBatchJobs(organizationId: string, limit: number = 10) {
    const jobs = await db
      .select({
        id: queryBatchJobs.id,
        batchId: queryBatchJobs.batchId,
        status: queryBatchJobs.status,
        totalQueries: queryBatchJobs.totalQueries,
        processedQueries: queryBatchJobs.processedQueries,
        failedQueries: queryBatchJobs.failedQueries,
        startedAt: queryBatchJobs.startedAt,
        completedAt: queryBatchJobs.completedAt,
        processingTime: queryBatchJobs.processingTime,
        triggerReason: queryBatchJobs.triggerReason,
        createdAt: queryBatchJobs.createdAt,
      })
      .from(queryBatchJobs)
      .where(eq(queryBatchJobs.organizationId, organizationId))
      .orderBy(desc(queryBatchJobs.createdAt))
      .limit(limit);

    return jobs;
  }

  /**
   * Get query patterns with filtering options
   */
  async getQueryPatterns(organizationId: string, options: {
    businessDomain?: string;
    minUsageCount?: number;
    minConfidence?: number;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    const {
      businessDomain,
      minUsageCount = 1,
      minConfidence = 0.5,
      isActive = true,
      limit = 20,
      offset = 0
    } = options;

    let query = db
      .select()
      .from(queryPatterns)
      .where(and(
        eq(queryPatterns.organizationId, organizationId),
        eq(queryPatterns.isActive, isActive),
        gt(queryPatterns.usageCount, minUsageCount - 1),
        gt(queryPatterns.confidenceLevel, minConfidence - 0.0001)
      ))
      .orderBy(desc(queryPatterns.usageCount))
      .limit(limit)
      .offset(offset);

    if (businessDomain) {
      query = query.where(eq(queryPatterns.businessDomain, businessDomain));
    }

    return await query;
  }

  /**
   * Get pattern count for pagination
   */
  async getPatternCount(organizationId: string, options: {
    businessDomain?: string;
    minUsageCount?: number;
    minConfidence?: number;
    isActive?: boolean;
  } = {}) {
    const {
      businessDomain,
      minUsageCount = 1,
      minConfidence = 0.5,
      isActive = true
    } = options;

    let query = db
      .select({ count: sql`count(*)` })
      .from(queryPatterns)
      .where(and(
        eq(queryPatterns.organizationId, organizationId),
        eq(queryPatterns.isActive, isActive),
        gt(queryPatterns.usageCount, minUsageCount - 1),
        gt(queryPatterns.confidenceLevel, minConfidence - 0.0001)
      ));

    if (businessDomain) {
      query = query.where(eq(queryPatterns.businessDomain, businessDomain));
    }

    const [result] = await query;
    return Number(result.count);
  }

  /**
   * Create a new query pattern
   */
  async createQueryPattern(organizationId: string, patternData: {
    patternName: string;
    patternTemplate: string;
    patternDescription?: string;
    businessDomain?: string;
    useCases?: string[];
    parameters?: any[];
  }) {
    const [pattern] = await db
      .insert(queryPatterns)
      .values({
        organizationId,
        patternName: patternData.patternName,
        patternTemplate: patternData.patternTemplate,
        patternDescription: patternData.patternDescription,
        businessDomain: patternData.businessDomain,
        useCases: patternData.useCases || [],
        parameters: patternData.parameters || [],
        usageCount: 0,
        confidenceLevel: 0.5,
        isActive: true,
        version: 1,
      })
      .returning();

    return pattern;
  }

  /**
   * Get query intelligence with filtering options
   */
  async getQueryIntelligence(organizationId: string, options: {
    workspaceId?: string;
    intent?: string;
    complexity?: string;
    minExecutionCount?: number;
    minConfidence?: number;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  } = {}) {
    const {
      workspaceId,
      intent,
      complexity,
      minExecutionCount = 1,
      minConfidence = 0,
      isActive = true,
      sortBy = 'lastUsed',
      sortOrder = 'desc',
      limit = 20,
      offset = 0
    } = options;

    let whereConditions = [
      eq(queryIntelligence.organizationId, organizationId),
      eq(queryIntelligence.isActive, isActive),
      gt(queryIntelligence.executionCount, minExecutionCount - 1),
      gt(queryIntelligence.confidenceScore, minConfidence - 0.0001)
    ];

    if (workspaceId) {
      whereConditions.push(eq(queryIntelligence.workspaceId, workspaceId));
    }
    if (intent) {
      whereConditions.push(eq(queryIntelligence.intent, intent as any));
    }
    if (complexity) {
      whereConditions.push(eq(queryIntelligence.complexity, complexity as any));
    }

    const sortColumn = queryIntelligence[sortBy as keyof typeof queryIntelligence] || queryIntelligence.lastUsed;
    const orderFn = sortOrder === 'asc' ? sql`ASC` : desc;

    const results = await db
      .select()
      .from(queryIntelligence)
      .where(and(...whereConditions))
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset(offset);

    return results;
  }

  /**
   * Get intelligence count for pagination
   */
  async getIntelligenceCount(organizationId: string, options: {
    workspaceId?: string;
    intent?: string;
    complexity?: string;
    minExecutionCount?: number;
    minConfidence?: number;
    isActive?: boolean;
  } = {}) {
    const {
      workspaceId,
      intent,
      complexity,
      minExecutionCount = 1,
      minConfidence = 0,
      isActive = true
    } = options;

    let whereConditions = [
      eq(queryIntelligence.organizationId, organizationId),
      eq(queryIntelligence.isActive, isActive),
      gt(queryIntelligence.executionCount, minExecutionCount - 1),
      gt(queryIntelligence.confidenceScore, minConfidence - 0.0001)
    ];

    if (workspaceId) {
      whereConditions.push(eq(queryIntelligence.workspaceId, workspaceId));
    }
    if (intent) {
      whereConditions.push(eq(queryIntelligence.intent, intent as any));
    }
    if (complexity) {
      whereConditions.push(eq(queryIntelligence.complexity, complexity as any));
    }

    const [result] = await db
      .select({ count: sql`count(*)` })
      .from(queryIntelligence)
      .where(and(...whereConditions));

    return Number(result.count);
  }

  /**
   * Submit query feedback
   */
  async submitQueryFeedback(organizationId: string, userId: string, feedbackData: {
    queryIntelligenceId: string;
    rating: number;
    accuracy?: number;
    performance?: number;
    relevance?: number;
    comments?: string;
    suggestedImprovements?: string;
    sessionContext?: Record<string, any>;
  }) {
    const [feedback] = await db
      .insert(queryFeedback)
      .values({
        organizationId,
        queryIntelligenceId: feedbackData.queryIntelligenceId,
        userId,
        rating: feedbackData.rating,
        accuracy: feedbackData.accuracy,
        performance: feedbackData.performance,
        relevance: feedbackData.relevance,
        comments: feedbackData.comments,
        suggestedImprovements: feedbackData.suggestedImprovements,
        sessionContext: feedbackData.sessionContext,
      })
      .returning();

    return feedback;
  }

  /**
   * Get query analytics and statistics
   */
  async getQueryAnalytics(organizationId: string, options: {
    workspaceId?: string;
    dateFrom?: string;
    dateTo?: string;
    intent?: string;
    complexity?: string;
    groupBy?: 'day' | 'week' | 'month' | 'intent' | 'complexity' | 'workspace';
  } = {}) {
    const {
      workspaceId,
      dateFrom,
      dateTo,
      intent,
      complexity,
      groupBy = 'day'
    } = options;

    let whereConditions = [eq(queryIntelligence.organizationId, organizationId)];
    
    if (workspaceId) {
      whereConditions.push(eq(queryIntelligence.workspaceId, workspaceId));
    }
    if (dateFrom) {
      whereConditions.push(gt(queryIntelligence.firstSeen, dateFrom));
    }
    if (dateTo) {
      whereConditions.push(lt(queryIntelligence.firstSeen, dateTo));
    }
    if (intent) {
      whereConditions.push(eq(queryIntelligence.intent, intent as any));
    }
    if (complexity) {
      whereConditions.push(eq(queryIntelligence.complexity, complexity as any));
    }

    // Build group by clause based on the groupBy parameter
    let groupByClause;
    let selectClause;

    switch (groupBy) {
      case 'day':
        groupByClause = sql`DATE(${queryIntelligence.firstSeen})`;
        selectClause = sql`DATE(${queryIntelligence.firstSeen}) as period`;
        break;
      case 'week':
        groupByClause = sql`DATE_TRUNC('week', ${queryIntelligence.firstSeen})`;
        selectClause = sql`DATE_TRUNC('week', ${queryIntelligence.firstSeen}) as period`;
        break;
      case 'month':
        groupByClause = sql`DATE_TRUNC('month', ${queryIntelligence.firstSeen})`;
        selectClause = sql`DATE_TRUNC('month', ${queryIntelligence.firstSeen}) as period`;
        break;
      case 'intent':
        groupByClause = queryIntelligence.intent;
        selectClause = sql`${queryIntelligence.intent} as period`;
        break;
      case 'complexity':
        groupByClause = queryIntelligence.complexity;
        selectClause = sql`${queryIntelligence.complexity} as period`;
        break;
      case 'workspace':
        groupByClause = queryIntelligence.workspaceId;
        selectClause = sql`${queryIntelligence.workspaceId} as period`;
        break;
      default:
        groupByClause = sql`DATE(${queryIntelligence.firstSeen})`;
        selectClause = sql`DATE(${queryIntelligence.firstSeen}) as period`;
    }

    const analytics = await db
      .select({
        period: selectClause,
        totalQueries: sql`COUNT(*)`,
        totalExecutions: sql`SUM(${queryIntelligence.executionCount})`,
        avgExecutionTime: sql`AVG(${queryIntelligence.avgExecutionTime})`,
        avgSuccessRate: sql`AVG(${queryIntelligence.successRate})`,
        avgConfidenceScore: sql`AVG(${queryIntelligence.confidenceScore})`,
        uniqueIntents: sql`COUNT(DISTINCT ${queryIntelligence.intent})`,
        uniqueComplexities: sql`COUNT(DISTINCT ${queryIntelligence.complexity})`,
      })
      .from(queryIntelligence)
      .where(and(...whereConditions))
      .groupBy(groupByClause)
      .orderBy(selectClause);

    // Get overall summary statistics
    const [summary] = await db
      .select({
        totalQueries: sql`COUNT(*)`,
        totalExecutions: sql`SUM(${queryIntelligence.executionCount})`,
        avgExecutionTime: sql`AVG(${queryIntelligence.avgExecutionTime})`,
        avgSuccessRate: sql`AVG(${queryIntelligence.successRate})`,
        avgConfidenceScore: sql`AVG(${queryIntelligence.confidenceScore})`,
        activeQueries: sql`COUNT(*) FILTER (WHERE ${queryIntelligence.isActive} = true)`,
      })
      .from(queryIntelligence)
      .where(and(...whereConditions));

    return {
      analytics,
      summary,
      groupBy,
      dateRange: { from: dateFrom, to: dateTo }
    };
  }

  /**
   * Find similar queries for evolution (updated method)
   */
  async findSimilarQueries(
    organizationId: string,
    queryText: string,
    options: {
      similarityThreshold?: number;
      limit?: number;
    } = {}
  ) {
    const { similarityThreshold = 0.7, limit = 10 } = options;
    
    // Generate embedding for the search query
    const embedding = await this.vectorService.generateEmbedding(queryText);
    
    // Search for similar queries using vector similarity
    const results = await db
      .select({
        id: queryIntelligence.id,
        queryPattern: queryIntelligence.queryPattern,
        originalQuery: queryIntelligence.originalQuery,
        userPrompt: queryIntelligence.userPrompt,
        intent: queryIntelligence.intent,
        complexity: queryIntelligence.complexity,
        executionCount: queryIntelligence.executionCount,
        avgExecutionTime: queryIntelligence.avgExecutionTime,
        successRate: queryIntelligence.successRate,
        confidenceScore: queryIntelligence.confidenceScore,
        similarity: sql`1 - (${queryIntelligence.queryEmbedding} <=> ${embedding}::vector)`,
      })
      .from(queryIntelligence)
      .where(and(
        eq(queryIntelligence.organizationId, organizationId),
        eq(queryIntelligence.isActive, true),
        sql`1 - (${queryIntelligence.queryEmbedding} <=> ${embedding}::vector) > ${similarityThreshold}`
      ))
      .orderBy(sql`${queryIntelligence.queryEmbedding} <=> ${embedding}::vector`)
      .limit(limit);

    return results;
  }

  /**
   * Utility functions
   */
  private normalizeSQL(query: string): string {
    return query
      .replace(/\s+/g, ' ')
      .replace(/'[^']*'/g, '?')
      .replace(/\d+/g, '?')
      .replace(/\$\d+/g, '?')
      .trim()
      .toLowerCase();
  }

  private hashQuery(query: string): string {
    return crypto.createHash('sha256').update(query).digest('hex');
  }

  private classifyQueryIntent(query: string): QueryPattern['intent'] {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('select')) return 'read';
    if (lowerQuery.includes('insert') || lowerQuery.includes('update') || lowerQuery.includes('delete')) return 'write';
    if (lowerQuery.includes('count') || lowerQuery.includes('sum') || lowerQuery.includes('avg')) return 'analyze';
    if (lowerQuery.includes('like') || lowerQuery.includes('ilike')) return 'search';
    return 'unknown';
  }

  private assessQueryComplexity(query: string): QueryPattern['complexity'] {
    const joinCount = (query.match(/join/gi) || []).length;
    const subqueryCount = (query.match(/\(/g) || []).length;
    
    if (joinCount === 0 && subqueryCount <= 1) return 'simple';
    if (joinCount <= 2 && subqueryCount <= 2) return 'moderate';
    if (joinCount <= 5 && subqueryCount <= 5) return 'complex';
    return 'advanced';
  }

  private extractTables(query: string): string[] {
    const tables = new Set<string>();
    const fromMatch = query.match(/from\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi);
    const joinMatch = query.match(/join\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi);
    
    fromMatch?.forEach(match => {
      const table = match.split(/\s+/)[1];
      if (table) tables.add(table.toLowerCase());
    });
    
    joinMatch?.forEach(match => {
      const table = match.split(/\s+/)[1];
      if (table) tables.add(table.toLowerCase());
    });
    
    return Array.from(tables);
  }

  private createQueryTemplate(query: string): string {
    return query
      .replace(/\?/g, '${param}')
      .replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*\${param}/g, '${$1} = ${param}');
  }

  private extractParameters(template: string): any[] {
    const params = [];
    const paramMatches = template.match(/\$\{([^}]+)\}/g);
    
    if (paramMatches) {
      const uniqueParams = [...new Set(paramMatches)];
      uniqueParams.forEach(param => {
        const name = param.replace(/\$\{|\}/g, '');
        params.push({
          name,
          type: name.includes('date') ? 'date' : name.includes('id') ? 'uuid' : 'string',
          required: true
        });
      });
    }
    
    return params;
  }

  private inferBusinessDomain(tables: string[]): string {
    const domains = {
      finance: ['invoices', 'payments', 'bills', 'transactions', 'accounts'],
      hr: ['users', 'employees', 'payroll'],
      sales: ['customers', 'orders', 'products'],
      inventory: ['inventory', 'warehouses', 'stock']
    };

    for (const [domain, domainTables] of Object.entries(domains)) {
      if (tables.some(table => domainTables.includes(table))) {
        return domain;
      }
    }

    return 'general';
  }

  /**
   * Get batch processing statistics
   */
  async getBatchStatistics(organizationId: string, days: number = 30): Promise<any> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [batchStats] = await db
      .select({
        totalBatches: sql<number>`count(*)`,
        successfulBatches: sql<number>`count(*) filter (where status = 'completed')`,
        totalQueries: sql<number>`sum(total_queries)`,
        processedQueries: sql<number>`sum(processed_queries)`,
        avgProcessingTime: sql<number>`avg(processing_time)`,
      })
      .from(queryBatchJobs)
      .where(and(
        eq(queryBatchJobs.organizationId, organizationId),
        gt(queryBatchJobs.createdAt, since)
      ));

    return batchStats;
  }
}

// Export singleton instance
export const queryEvolution = new QueryEvolutionService();