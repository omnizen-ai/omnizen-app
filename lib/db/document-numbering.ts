import { sql } from 'drizzle-orm';
import { db } from './index';
import { documentNumberSequences, generatedDocumentNumbers, type DocumentSequence } from './schema';

// Document types that support auto-numbering
export type DocumentType = 
  | 'invoice' 
  | 'bill' 
  | 'payment' 
  | 'journal_entry'
  | 'sales_order' 
  | 'purchase_order' 
  | 'quotation'
  | 'fulfillment' 
  | 'receipt' 
  | 'stock_move' 
  | 'adjustment'
  | 'bank_transaction' 
  | 'forecast';

// Configuration for creating new sequences
export interface SequenceConfig {
  prefix?: string;
  suffix?: string;
  padding?: number;
  includeYear?: boolean;
  includePeriod?: boolean;
  resetFrequency?: 'never' | 'yearly' | 'monthly' | 'quarterly';
  customFormat?: string;
  description?: string;
}

// Default configurations for different document types
const DEFAULT_CONFIGS: Record<DocumentType, SequenceConfig> = {
  invoice: {
    prefix: 'INV-',
    padding: 3,
    includeYear: true,
    resetFrequency: 'yearly',
    description: 'Customer invoices'
  },
  bill: {
    prefix: 'BILL-',
    padding: 3,
    includeYear: true,
    resetFrequency: 'yearly',
    description: 'Vendor bills'
  },
  payment: {
    prefix: 'PAY-',
    padding: 4,
    includeYear: true,
    resetFrequency: 'yearly',
    description: 'Payments and receipts'
  },
  journal_entry: {
    prefix: 'JE-',
    padding: 4,
    includeYear: true,
    resetFrequency: 'yearly',
    description: 'Journal entries'
  },
  sales_order: {
    prefix: 'SO-',
    padding: 4,
    includeYear: true,
    resetFrequency: 'yearly',
    description: 'Sales orders'
  },
  purchase_order: {
    prefix: 'PO-',
    padding: 4,
    includeYear: true,
    resetFrequency: 'yearly',
    description: 'Purchase orders'
  },
  quotation: {
    prefix: 'QUO-',
    padding: 3,
    includeYear: true,
    resetFrequency: 'yearly',
    description: 'Sales quotations'
  },
  fulfillment: {
    prefix: 'FUL-',
    padding: 4,
    includeYear: true,
    resetFrequency: 'yearly',
    description: 'Order fulfillments'
  },
  receipt: {
    prefix: 'REC-',
    padding: 4,
    includeYear: true,
    resetFrequency: 'yearly',
    description: 'Purchase receipts'
  },
  stock_move: {
    prefix: 'STK-',
    padding: 5,
    includeYear: true,
    resetFrequency: 'yearly',
    description: 'Stock movements'
  },
  adjustment: {
    prefix: 'ADJ-',
    padding: 4,
    includeYear: true,
    resetFrequency: 'yearly',
    description: 'Inventory adjustments'
  },
  bank_transaction: {
    prefix: 'BTX-',
    padding: 5,
    includeYear: true,
    resetFrequency: 'monthly',
    description: 'Bank transactions'
  },
  forecast: {
    prefix: 'FCT-',
    padding: 3,
    includeYear: true,
    resetFrequency: 'yearly',
    description: 'Cash flow forecasts'
  }
};

/**
 * Service class for managing document number generation
 * Provides type-safe access to PostgreSQL functions and sequence management
 */
export class DocumentNumberService {
  private organizationId: string;
  private userId?: string;

  constructor(organizationId: string, userId?: string) {
    this.organizationId = organizationId;
    this.userId = userId;
  }

  /**
   * Generate the next document number for the specified type
   * This is atomic and thread-safe
   */
  async generateNextNumber(documentType: DocumentType): Promise<string> {
    try {
      const result = await db.execute(sql`
        SELECT generate_next_document_number(
          ${this.organizationId}::uuid,
          ${documentType}::text,
          ${this.userId ? sql`${this.userId}::uuid` : sql`NULL`}
        ) as number
      `);

      const generatedNumber = result.rows[0]?.number as string;
      
      if (!generatedNumber) {
        throw new Error(`Failed to generate document number for ${documentType}`);
      }

      return generatedNumber;
    } catch (error) {
      console.error(`Error generating document number for ${documentType}:`, error);
      throw new Error(`Failed to generate ${documentType} number: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Preview what the next document number would be without consuming it
   */
  async previewNextNumber(documentType: DocumentType): Promise<string> {
    try {
      const result = await db.execute(sql`
        SELECT preview_next_document_number(
          ${this.organizationId}::uuid,
          ${documentType}::text
        ) as number
      `);

      return result.rows[0]?.number as string || `${documentType.toUpperCase()}-${new Date().getFullYear()}-001`;
    } catch (error) {
      console.error(`Error previewing document number for ${documentType}:`, error);
      return `${documentType.toUpperCase()}-${new Date().getFullYear()}-001`;
    }
  }

  /**
   * Mark a generated document number as used
   * This should be called when the document is successfully created
   */
  async markNumberAsUsed(generatedNumber: string, documentId: string): Promise<boolean> {
    try {
      const result = await db.execute(sql`
        SELECT mark_document_number_used(
          ${this.organizationId}::uuid,
          ${generatedNumber}::text,
          ${documentId}::uuid
        ) as success
      `);

      return result.rows[0]?.success === true;
    } catch (error) {
      console.error(`Error marking document number ${generatedNumber} as used:`, error);
      return false;
    }
  }

  /**
   * Get or create a sequence configuration for a document type
   */
  async getOrCreateSequence(
    documentType: DocumentType, 
    config?: SequenceConfig
  ): Promise<DocumentSequence> {
    // First try to get existing sequence
    const existing = await db.query.documentNumberSequences.findFirst({
      where: (sequences, { eq, and }) => and(
        eq(sequences.organizationId, this.organizationId),
        eq(sequences.documentType, documentType)
      )
    });

    if (existing) {
      return existing;
    }

    // Create new sequence with provided config or defaults
    const finalConfig = { ...DEFAULT_CONFIGS[documentType], ...config };
    
    const sampleFormat = this.buildSampleFormat(finalConfig);
    
    const [newSequence] = await db.insert(documentNumberSequences).values({
      organizationId: this.organizationId,
      documentType: documentType,
      currentNumber: 0,
      prefix: finalConfig.prefix || '',
      suffix: finalConfig.suffix || '',
      padding: finalConfig.padding || 3,
      includeYear: finalConfig.includeYear || false,
      includePeriod: finalConfig.includePeriod || false,
      resetFrequency: finalConfig.resetFrequency || 'yearly',
      sampleFormat,
      customFormat: finalConfig.customFormat,
      description: finalConfig.description,
      isActive: true,
      allowManualOverride: true,
    }).returning();

    return newSequence;
  }

  /**
   * Update sequence configuration
   */
  async updateSequenceConfig(
    documentType: DocumentType,
    config: Partial<SequenceConfig>
  ): Promise<DocumentSequence | null> {
    const sampleFormat = config.prefix || config.includeYear || config.padding 
      ? this.buildSampleFormat(config as SequenceConfig)
      : undefined;

    const updateData: any = {
      ...config,
      updatedAt: new Date(),
    };

    if (sampleFormat) {
      updateData.sampleFormat = sampleFormat;
    }

    const [updated] = await db
      .update(documentNumberSequences)
      .set(updateData)
      .where(sql`organization_id = ${this.organizationId} AND document_type = ${documentType}`)
      .returning();

    return updated || null;
  }

  /**
   * Get sequence configuration for a document type
   */
  async getSequenceConfig(documentType: DocumentType): Promise<DocumentSequence | null> {
    return await db.query.documentNumberSequences.findFirst({
      where: (sequences, { eq, and }) => and(
        eq(sequences.organizationId, this.organizationId),
        eq(sequences.documentType, documentType)
      )
    });
  }

  /**
   * Get all sequences for the organization
   */
  async getAllSequences(): Promise<DocumentSequence[]> {
    return await db.query.documentNumberSequences.findMany({
      where: (sequences, { eq }) => eq(sequences.organizationId, this.organizationId),
      orderBy: (sequences, { asc }) => asc(sequences.documentType)
    });
  }

  /**
   * Build a sample format string for display
   */
  private buildSampleFormat(config: SequenceConfig): string {
    let format = config.prefix || '';
    
    if (config.includeYear) {
      format += (format ? '-' : '') + 'YYYY';
    }
    
    if (config.includePeriod) {
      format += (format ? '-' : '') + 'MM';
    }
    
    format += (format ? '-' : '') + '{' + '#'.repeat(config.padding || 3) + '}';
    
    if (config.suffix) {
      format += config.suffix;
    }
    
    return format;
  }

  /**
   * Validate if a document number follows the organization's pattern
   */
  async validateDocumentNumber(
    documentType: DocumentType, 
    documentNumber: string
  ): Promise<boolean> {
    const sequence = await this.getSequenceConfig(documentType);
    
    if (!sequence) {
      // If no sequence exists, any format is valid (manual numbering)
      return true;
    }

    // Basic validation - check if it starts with expected prefix
    if (sequence.prefix && !documentNumber.startsWith(sequence.prefix)) {
      return false;
    }

    return true;
  }

  /**
   * Check if manual override is allowed for a document type
   */
  async canManualOverride(documentType: DocumentType): Promise<boolean> {
    const sequence = await this.getSequenceConfig(documentType);
    return sequence?.allowManualOverride || true;
  }
}

/**
 * Factory function to create DocumentNumberService instance
 */
export function createDocumentNumberService(organizationId: string, userId?: string) {
  return new DocumentNumberService(organizationId, userId);
}

/**
 * Utility function to generate document number (direct function call)
 * Useful for one-off generations
 */
export async function generateDocumentNumber(
  organizationId: string,
  documentType: DocumentType,
  userId?: string
): Promise<string> {
  const service = new DocumentNumberService(organizationId, userId);
  return service.generateNextNumber(documentType);
}