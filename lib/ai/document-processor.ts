import * as path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import { documentsTable, documentProcessingJobs, documentEmbeddings } from '@/lib/db/schema/documents/documents';
import { VectorService } from './vector-utils';
import { eq } from 'drizzle-orm';
import { withRLSTransaction } from '@/lib/api/base';
import type { RLSContext } from '@/lib/api/base';

export interface ProcessingOptions {
  organizationId: string;
  workspaceId?: string;
  userId: string;
  category?: string;
  tags?: string[];
  chunkSize?: number;
  chunkOverlap?: number;
  generateEmbeddings?: boolean;
  performOCR?: boolean;
}

export interface ProcessingResult {
  success: boolean;
  documentId?: string;
  extractedText?: string;
  textLength?: number;
  chunks?: number;
  error?: string;
  processingTime: number;
}

export interface FileInfo {
  originalName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
  storageUrl?: string;
  storageKey?: string;
}

export class DocumentProcessor {
  private vectorService: VectorService;

  constructor() {
    this.vectorService = new VectorService();
  }

  /**
   * Main document processing pipeline
   */
  async processDocument(
    fileInfo: FileInfo,
    options: ProcessingOptions,
    rlsContext?: RLSContext
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    let documentId: string | undefined;

    try {
      // If RLS context is provided, use RLS transaction for all database operations
      if (rlsContext) {
        return await withRLSTransaction(rlsContext, async (tx) => {
          return await this.processDocumentInTransaction(tx, fileInfo, options);
        });
      } else {
        // Fallback to direct operations (for backward compatibility)
        return await this.processDocumentDirect(fileInfo, options);
      }
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (documentId) {
        await this.updateDocumentStatus(documentId, 'failed', errorMessage);
      }

      return {
        success: false,
        error: errorMessage,
        processingTime,
      };
    }
  }

  /**
   * Process document using RLS transaction (recommended)
   */
  private async processDocumentInTransaction(
    tx: any,
    fileInfo: FileInfo,
    options: ProcessingOptions
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    // Create document record
    const documentResult = await this.createDocumentRecordInTx(tx, fileInfo, options);
    const documentId = documentResult.id;

    // Create processing job
    const jobId = await this.createProcessingJobInTx(
      tx,
      documentId,
      options.organizationId,
      'extract_text'
    );

    // Extract text based on file type
    const extractedText = await this.extractText(fileInfo, options);
    
    if (!extractedText?.trim()) {
      throw new Error('No text could be extracted from the document');
    }

    // Update document with extracted text
    await this.updateDocumentTextInTx(tx, documentId, extractedText);

    // Generate chunks and embeddings if requested
    let chunks = 0;
    if (options.generateEmbeddings !== false) {
      chunks = await this.generateEmbeddingsInTx(
        tx,
        documentId,
        extractedText,
        options
      );
    }

    // Mark processing job as completed
    await this.completeProcessingJobInTx(tx, jobId, {
      textLength: extractedText.length,
      chunks,
    }, startTime);

    // Update document status
    await this.updateDocumentStatusInTx(tx, documentId, 'processed');

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      documentId,
      extractedText,
      textLength: extractedText.length,
      chunks,
      processingTime,
    };
  }

  /**
   * Process document directly (legacy fallback)
   */
  private async processDocumentDirect(
    fileInfo: FileInfo,
    options: ProcessingOptions
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    let documentId: string | undefined;

    try {
      // Create document record
      const documentResult = await this.createDocumentRecord(fileInfo, options);
      documentId = documentResult.id;

      // Create processing job
      const jobId = await this.createProcessingJob(
        documentId,
        options.organizationId,
        'extract_text'
      );

      // Extract text based on file type
      const extractedText = await this.extractText(fileInfo, options);
      
      if (!extractedText?.trim()) {
        throw new Error('No text could be extracted from the document');
      }

      // Update document with extracted text
      await this.updateDocumentText(documentId, extractedText);

      // Generate chunks and embeddings if requested
      let chunks = 0;
      if (options.generateEmbeddings !== false) {
        chunks = await this.generateEmbeddings(
          documentId,
          extractedText,
          options
        );
      }

      // Mark processing job as completed
      await this.completeProcessingJob(jobId, {
        textLength: extractedText.length,
        chunks,
      }, startTime);

      // Update document status
      await this.updateDocumentStatus(documentId, 'processed');

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        documentId,
        extractedText,
        textLength: extractedText.length,
        chunks,
        processingTime,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (documentId) {
        await this.updateDocumentStatus(documentId, 'failed', errorMessage);
      }

      return {
        success: false,
        error: errorMessage,
        processingTime,
      };
    }
  }

  /**
   * Extract text from various file types
   */
  private async extractText(
    fileInfo: FileInfo,
    options: ProcessingOptions
  ): Promise<string> {
    const fileType = this.getFileType(fileInfo.originalName, fileInfo.mimeType);

    switch (fileType) {
      case 'pdf':
        return await this.extractFromPDF(fileInfo.buffer);
      
      case 'docx':
        return await this.extractFromDOCX(fileInfo.buffer);
      
      case 'xlsx':
        return await this.extractFromXLSX(fileInfo.buffer);
      
      case 'csv':
        return await this.extractFromCSV(fileInfo.buffer);
      
      case 'txt':
        return fileInfo.buffer.toString('utf-8');
      
      case 'image':
        if (options.performOCR !== false) {
          return await this.extractFromImage(fileInfo.buffer);
        }
        throw new Error('OCR disabled for image files');
      
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  /**
   * Extract text from PDF using pdf-parse
   */
  private async extractFromPDF(buffer: Buffer): Promise<string> {
    try {
      // Use require for better compatibility with pdf-parse
      const pdf = require('pdf-parse');
      const data = await pdf(buffer);
      return data.text || '';
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error(`Failed to extract PDF text: ${error.message || error}`);
    }
  }

  /**
   * Extract text from DOCX using mammoth
   */
  private async extractFromDOCX(buffer: Buffer): Promise<string> {
    try {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      throw new Error(`Failed to extract DOCX text: ${error}`);
    }
  }

  /**
   * Extract text from XLSX using xlsx
   */
  private async extractFromXLSX(buffer: Buffer): Promise<string> {
    try {
      const XLSX = require('xlsx');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const texts: string[] = [];

      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const sheetText = XLSX.utils.sheet_to_csv(worksheet, { FS: '\t' });
        if (sheetText.trim()) {
          texts.push(`Sheet: ${sheetName}\n${sheetText}`);
        }
      });

      return texts.join('\n\n');
    } catch (error) {
      throw new Error(`Failed to extract XLSX text: ${error}`);
    }
  }

  /**
   * Extract text from CSV
   */
  private async extractFromCSV(buffer: Buffer): Promise<string> {
    try {
      const XLSX = require('xlsx');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      return XLSX.utils.sheet_to_csv(firstSheet);
    } catch (error) {
      throw new Error(`Failed to extract CSV text: ${error}`);
    }
  }

  /**
   * Extract text from images using OCR
   */
  private async extractFromImage(buffer: Buffer): Promise<string> {
    let worker: any = null;
    
    try {
      // Use require for better compatibility
      const sharp = require('sharp');
      const { createWorker } = require('tesseract.js');
      
      // Optimize image for OCR
      const optimizedBuffer = await sharp(buffer)
        .greyscale()
        .normalize()
        .sharpen()
        .png()
        .toBuffer();

      worker = await createWorker('eng');
      const { data } = await worker.recognize(optimizedBuffer);
      
      return data.text || '';
    } catch (error) {
      throw new Error(`Failed to perform OCR: ${error}`);
    } finally {
      if (worker) {
        await worker.terminate();
      }
    }
  }

  /**
   * Generate text chunks and vector embeddings
   */
  private async generateEmbeddings(
    documentId: string,
    text: string,
    options: ProcessingOptions
  ): Promise<number> {
    const chunkSize = options.chunkSize || 1000;
    const chunkOverlap = options.chunkOverlap || 200;
    
    const chunks = this.chunkText(text, chunkSize, chunkOverlap);
    const embeddingPromises: Promise<void>[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      embeddingPromises.push(
        this.createEmbeddingRecord(
          documentId,
          chunk,
          i,
          chunks.length,
          options
        )
      );
    }

    await Promise.all(embeddingPromises);
    return chunks.length;
  }

  /**
   * Generate embeddings within RLS transaction
   */
  private async generateEmbeddingsInTx(
    tx: any,
    documentId: string,
    text: string,
    options: ProcessingOptions
  ): Promise<number> {
    const chunkSize = options.chunkSize || 1000;
    const chunkOverlap = options.chunkOverlap || 200;
    
    const chunks = this.chunkText(text, chunkSize, chunkOverlap);
    const embeddingPromises: Promise<void>[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      embeddingPromises.push(
        this.createEmbeddingRecordInTx(
          tx,
          documentId,
          chunk,
          i,
          chunks.length,
          options
        )
      );
    }

    await Promise.all(embeddingPromises);
    return chunks.length;
  }

  /**
   * Create embedding record with vector
   */
  private async createEmbeddingRecord(
    documentId: string,
    content: string,
    chunkIndex: number,
    chunkCount: number,
    options: ProcessingOptions
  ): Promise<void> {
    try {
      // Generate embedding
      const embedding = await this.vectorService.generateEmbedding(content);
      
      // Create hash for deduplication
      const contentHash = await this.vectorService.hashContent(content);

      await db.insert(documentEmbeddings).values({
        id: uuidv4(),
        organizationId: options.organizationId,
        workspaceId: options.workspaceId,
        documentId,
        chunkIndex,
        chunkCount,
        content,
        contentHash,
        embedding,
        metadata: {
          chunkSize: content.length,
          startChar: chunkIndex * (options.chunkSize || 1000),
          endChar: (chunkIndex * (options.chunkSize || 1000)) + content.length,
        },
        documentType: this.getFileType('', ''),
        category: options.category,
        searchText: content.toLowerCase(),
      });
    } catch (error) {
      console.error(`Failed to create embedding for chunk ${chunkIndex}:`, error);
      throw error;
    }
  }

  /**
   * Create embedding record with vector within RLS transaction
   */
  private async createEmbeddingRecordInTx(
    tx: any,
    documentId: string,
    content: string,
    chunkIndex: number,
    chunkCount: number,
    options: ProcessingOptions
  ): Promise<void> {
    try {
      // Generate embedding
      const embedding = await this.vectorService.generateEmbedding(content);
      
      // Create hash for deduplication
      const contentHash = await this.vectorService.hashContent(content);

      await tx.insert(documentEmbeddings).values({
        id: uuidv4(),
        organizationId: options.organizationId,
        workspaceId: options.workspaceId,
        documentId,
        chunkIndex,
        chunkCount,
        content,
        contentHash,
        embedding,
        metadata: {
          chunkSize: content.length,
          startChar: chunkIndex * (options.chunkSize || 1000),
          endChar: (chunkIndex * (options.chunkSize || 1000)) + content.length,
        },
        documentType: this.getFileType('', ''),
        category: options.category,
        searchText: content.toLowerCase(),
      });
    } catch (error) {
      console.error(`Failed to create embedding for chunk ${chunkIndex}:`, error);
      throw error;
    }
  }

  /**
   * Split text into overlapping chunks
   */
  private chunkText(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/[.!?]+\s+/).filter(s => s.trim());
    
    let currentChunk = '';
    let currentSize = 0;

    for (const sentence of sentences) {
      const sentenceLength = sentence.length;
      
      if (currentSize + sentenceLength > chunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        
        // Create overlap by keeping some text from the end of current chunk
        const overlapText = this.getOverlapText(currentChunk, overlap);
        currentChunk = `${overlapText} ${sentence}`;
        currentSize = currentChunk.length;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence;
        currentSize = currentChunk.length;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Get overlap text from the end of a chunk
   */
  private getOverlapText(text: string, overlapSize: number): string {
    if (text.length <= overlapSize) {
      return text;
    }
    
    const overlapText = text.slice(-overlapSize);
    const lastSpaceIndex = overlapText.indexOf(' ');
    
    return lastSpaceIndex > 0 ? overlapText.slice(lastSpaceIndex + 1) : overlapText;
  }

  /**
   * Create document record in database
   */
  private async createDocumentRecord(
    fileInfo: FileInfo,
    options: ProcessingOptions
  ) {
    const documentId = uuidv4();
    const fileType = this.getFileType(fileInfo.originalName, fileInfo.mimeType);

    const [document] = await db.insert(documentsTable).values({
      id: documentId,
      organizationId: options.organizationId,
      workspaceId: options.workspaceId,
      title: path.parse(fileInfo.originalName).name,
      fileName: fileInfo.originalName,
      fileType: fileType as any,
      fileSize: fileInfo.size,
      mimeType: fileInfo.mimeType,
      storageUrl: fileInfo.storageUrl || '',
      storageKey: fileInfo.storageKey || '',
      status: 'processing',
      metadata: {
        originalName: fileInfo.originalName,
        uploadedAt: new Date().toISOString(),
      },
      category: options.category,
      tags: options.tags || [],
      createdBy: options.userId,
    }).returning();

    return document;
  }

  /**
   * Create document record within RLS transaction
   */
  private async createDocumentRecordInTx(
    tx: any,
    fileInfo: FileInfo,
    options: ProcessingOptions
  ) {
    const documentId = uuidv4();
    const fileType = this.getFileType(fileInfo.originalName, fileInfo.mimeType);

    const [document] = await tx.insert(documentsTable).values({
      id: documentId,
      organizationId: options.organizationId,
      workspaceId: options.workspaceId,
      title: path.parse(fileInfo.originalName).name,
      fileName: fileInfo.originalName,
      fileType: fileType as any,
      fileSize: fileInfo.size,
      mimeType: fileInfo.mimeType,
      storageUrl: fileInfo.storageUrl || '',
      storageKey: fileInfo.storageKey || '',
      status: 'processing',
      metadata: {
        originalName: fileInfo.originalName,
        uploadedAt: new Date().toISOString(),
      },
      category: options.category,
      tags: options.tags || [],
      createdBy: options.userId,
    }).returning();

    return document;
  }

  /**
   * Create processing job record
   */
  private async createProcessingJob(
    documentId: string,
    organizationId: string,
    jobType: string
  ): Promise<string> {
    const jobId = uuidv4();
    
    await db.insert(documentProcessingJobs).values({
      id: jobId,
      organizationId,
      documentId,
      jobType,
      status: 'running',
      startedAt: new Date(),
    });

    return jobId;
  }

  /**
   * Create processing job record within RLS transaction
   */
  private async createProcessingJobInTx(
    tx: any,
    documentId: string,
    organizationId: string,
    jobType: string
  ): Promise<string> {
    const jobId = uuidv4();
    
    await tx.insert(documentProcessingJobs).values({
      id: jobId,
      organizationId,
      documentId,
      jobType,
      status: 'running',
      startedAt: new Date(),
    });

    return jobId;
  }

  /**
   * Update document with extracted text
   */
  private async updateDocumentText(
    documentId: string,
    extractedText: string
  ): Promise<void> {
    await db
      .update(documentsTable)
      .set({
        extractedText,
        textLength: extractedText.length,
        searchText: extractedText.toLowerCase(),
        updatedAt: new Date(),
      })
      .where(eq(documentsTable.id, documentId));
  }

  /**
   * Update document with extracted text within RLS transaction
   */
  private async updateDocumentTextInTx(
    tx: any,
    documentId: string,
    extractedText: string
  ): Promise<void> {
    await tx
      .update(documentsTable)
      .set({
        extractedText,
        textLength: extractedText.length,
        searchText: extractedText.toLowerCase(),
        updatedAt: new Date(),
      })
      .where(eq(documentsTable.id, documentId));
  }

  /**
   * Update document status
   */
  private async updateDocumentStatus(
    documentId: string,
    status: 'uploaded' | 'processing' | 'processed' | 'failed' | 'archived',
    error?: string
  ): Promise<void> {
    await db
      .update(documentsTable)
      .set({
        status,
        processedAt: status === 'processed' ? new Date() : undefined,
        processingError: error,
        updatedAt: new Date(),
      })
      .where(eq(documentsTable.id, documentId));
  }

  /**
   * Update document status within RLS transaction
   */
  private async updateDocumentStatusInTx(
    tx: any,
    documentId: string,
    status: 'uploaded' | 'processing' | 'processed' | 'failed' | 'archived',
    error?: string
  ): Promise<void> {
    await tx
      .update(documentsTable)
      .set({
        status,
        processedAt: status === 'processed' ? new Date() : undefined,
        processingError: error,
        updatedAt: new Date(),
      })
      .where(eq(documentsTable.id, documentId));
  }

  /**
   * Complete processing job
   */
  private async completeProcessingJob(
    jobId: string,
    result: any,
    startTime?: number
  ): Promise<void> {
    const duration = startTime ? Date.now() - startTime : null;
    
    await db
      .update(documentProcessingJobs)
      .set({
        status: 'completed',
        result,
        completedAt: new Date(),
        duration,
      })
      .where(eq(documentProcessingJobs.id, jobId));
  }

  /**
   * Complete processing job within RLS transaction
   */
  private async completeProcessingJobInTx(
    tx: any,
    jobId: string,
    result: any,
    startTime?: number
  ): Promise<void> {
    const duration = startTime ? Date.now() - startTime : null;
    
    await tx
      .update(documentProcessingJobs)
      .set({
        status: 'completed',
        result,
        completedAt: new Date(),
        duration,
      })
      .where(eq(documentProcessingJobs.id, jobId));
  }

  /**
   * Determine file type from name and mime type
   */
  private getFileType(fileName: string, mimeType: string): string {
    const extension = path.extname(fileName).toLowerCase();
    
    if (extension === '.pdf' || mimeType.includes('pdf')) return 'pdf';
    if (extension === '.docx' || mimeType.includes('wordprocessingml')) return 'docx';
    if (extension === '.xlsx' || mimeType.includes('spreadsheetml')) return 'xlsx';
    if (extension === '.csv' || mimeType.includes('csv')) return 'csv';
    if (extension === '.txt' || mimeType.includes('text/plain')) return 'txt';
    if (mimeType.startsWith('image/')) return 'image';
    
    return 'other';
  }

  /**
   * Search similar documents using vector similarity
   */
  async searchSimilarDocuments(
    query: string,
    options: {
      organizationId: string;
      workspaceId?: string;
      limit?: number;
      minSimilarity?: number;
      documentTypes?: string[];
      categories?: string[];
    }
  ) {
    return await this.vectorService.searchSimilar(query, {
      table: 'document_embeddings',
      organizationId: options.organizationId,
      limit: options.limit || 10,
      threshold: options.minSimilarity || 0.7,
      filters: {
        workspace_id: options.workspaceId,
        document_type: options.documentTypes,
        category: options.categories,
      },
    });
  }
}

// Export singleton instance
export const documentProcessor = new DocumentProcessor();