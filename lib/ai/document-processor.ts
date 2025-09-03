import * as fs from 'fs';
import * as path from 'path';
import * as pdf from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import * as sharp from 'sharp';
import { createWorker } from 'tesseract.js';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import { documentsTable, documentEmbeddings, documentProcessingJobs } from '@/lib/db/schema';
import type { DocumentRow, DocumentEmbeddingRow, DocumentProcessingJobRow } from '@/lib/types/database';
import { VectorService } from './vector-utils';
import { eq } from 'drizzle-orm';

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
      });

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
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      throw new Error(`Failed to extract PDF text: ${error}`);
    }
  }

  /**
   * Extract text from DOCX using mammoth
   */
  private async extractFromDOCX(buffer: Buffer): Promise<string> {
    try {
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
    let worker: Tesseract.Worker | null = null;
    
    try {
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
        currentChunk = overlapText + ' ' + sentence;
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
   * Complete processing job
   */
  private async completeProcessingJob(
    jobId: string,
    result: any
  ): Promise<void> {
    await db
      .update(documentProcessingJobs)
      .set({
        status: 'completed',
        result,
        completedAt: new Date(),
        duration: Date.now(),
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
      workspaceId: options.workspaceId,
      limit: options.limit || 10,
      minSimilarity: options.minSimilarity || 0.7,
      filters: {
        document_type: options.documentTypes,
        category: options.categories,
      },
    });
  }
}

// Export singleton instance
export const documentProcessor = new DocumentProcessor();