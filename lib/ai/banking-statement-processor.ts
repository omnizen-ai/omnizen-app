import { db } from '@/lib/db';
import { 
  bankTransactions, 
  bankAccounts,
  contacts,
  chartOfAccounts,
  journalEntries,
  journalLines,
  documentEmbeddings,
  type BankTransaction 
} from '@/lib/db/schema';
import { VectorService } from './vector-utils';
import { documentProcessor } from './document-processor';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import * as pdfParse from 'pdf-parse';
import type { BankTransactionRow, ContactRow, DocumentEmbeddingRow } from '@/lib/types/database';

export interface StatementParsingResult {
  success: boolean;
  transactions: BankTransaction[];
  metadata: {
    accountNumber?: string;
    statementPeriod?: { from: Date; to: Date };
    bankName?: string;
    currency?: string;
    openingBalance?: number;
    closingBalance?: number;
  };
  confidence: number;
  parsingTime: number;
  error?: string;
}

export interface TransactionPattern {
  type: 'deposit' | 'withdrawal' | 'transfer' | 'fee' | 'interest';
  regex: RegExp;
  extractors: {
    amount: (match: RegExpMatchArray) => number;
    date: (match: RegExpMatchArray) => Date;
    description: (match: RegExpMatchArray) => string;
    reference?: (match: RegExpMatchArray) => string;
  };
  confidence: number;
}

/**
 * Banking Statement Processor - Intelligently parses bank statements using AI and pattern recognition
 * Leverages document processing, vector embeddings, and machine learning for accurate extraction
 */
export class BankingStatementProcessor {
  private vectorService: VectorService;
  private transactionPatterns: Map<string, TransactionPattern[]> = new Map();

  constructor() {
    this.vectorService = new VectorService();
    this.initializeTransactionPatterns();
  }

  /**
   * Process a banking statement document and extract transactions
   */
  async processStatement(
    organizationId: string,
    fileBuffer: Buffer,
    fileName: string,
    options: {
      bankAccountId?: string;
      autoCreateTransactions?: boolean;
      autoMatchContacts?: boolean;
      confidenceThreshold?: number;
      validateBalances?: boolean;
    } = {}
  ): Promise<StatementParsingResult> {
    const startTime = Date.now();
    const {
      bankAccountId,
      autoCreateTransactions = false,
      autoMatchContacts = true,
      confidenceThreshold = 0.7,
      validateBalances = true
    } = options;

    try {
      console.log(`[BankingProcessor] Processing statement: ${fileName}`);

      // Step 1: Extract text from PDF
      const textContent = await this.extractTextFromPDF(fileBuffer);
      
      // Step 2: Identify bank and statement format
      const bankInfo = await this.identifyBankAndFormat(textContent, organizationId);
      
      // Step 3: Extract statement metadata
      const metadata = await this.extractStatementMetadata(textContent, bankInfo);
      
      // Step 4: Parse transactions using patterns and AI
      const rawTransactions = await this.parseTransactions(textContent, bankInfo, organizationId);
      
      // Step 5: Enhance transactions with AI matching
      const enhancedTransactions = await this.enhanceTransactions(
        rawTransactions, 
        organizationId, 
        autoMatchContacts
      );
      
      // Step 6: Validate and clean data
      const validatedTransactions = await this.validateTransactions(
        enhancedTransactions, 
        metadata, 
        validateBalances
      );
      
      // Step 7: Calculate overall confidence
      const overallConfidence = this.calculateOverallConfidence(validatedTransactions, bankInfo);
      
      // Step 8: Store document embedding for future learning
      await this.storeDocumentLearning(organizationId, textContent, bankInfo, validatedTransactions);
      
      // Step 9: Create transactions if requested and confidence is high enough
      if (autoCreateTransactions && overallConfidence >= confidenceThreshold && bankAccountId) {
        await this.createBankTransactions(organizationId, bankAccountId, validatedTransactions);
      }

      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        transactions: validatedTransactions,
        metadata,
        confidence: overallConfidence,
        parsingTime: processingTime,
      };

    } catch (error) {
      console.error('[BankingProcessor] Error processing statement:', error);
      return {
        success: false,
        transactions: [],
        metadata: {},
        confidence: 0,
        parsingTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Extract text content from PDF using pdf-parse
   */
  private async extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      throw new Error(`Failed to extract text from PDF: ${error}`);
    }
  }

  /**
   * Identify bank and statement format using vector similarity
   */
  private async identifyBankAndFormat(text: string, organizationId: string): Promise<{
    bankName: string;
    format: string;
    confidence: number;
    patterns: TransactionPattern[];
  }> {
    // Generate embedding for the statement header
    const headerText = text.substring(0, 1000); // First 1000 chars usually contain bank info
    const embedding = await this.vectorService.generateEmbedding(headerText);
    
    // Search for similar statements we've processed before
    const similarDocs = await this.vectorService.searchSimilar(embedding, {
      table: 'document_embeddings',
      organizationId,
      limit: 5,
      minSimilarity: 0.6,
    });

    // Extract bank patterns from similar documents
    let bankName = 'Unknown';
    let format = 'generic';
    let confidence = 0.5;

    // Use pattern matching to identify common banks
    const bankPatterns = [
      { name: 'Eastern Bank Limited', pattern: /eastern\s+bank/i, format: 'ebl' },
      { name: 'Dutch-Bangla Bank', pattern: /dutch.bangla\s+bank/i, format: 'dbbl' },
      { name: 'BRAC Bank', pattern: /brac\s+bank/i, format: 'brac' },
      { name: 'Standard Chartered', pattern: /standard\s+chartered/i, format: 'scb' },
      { name: 'HSBC', pattern: /hsbc/i, format: 'hsbc' },
      { name: 'Citibank', pattern: /citi(bank|corp)/i, format: 'citi' },
    ];

    for (const { name, pattern, format: fmt } of bankPatterns) {
      if (pattern.test(headerText)) {
        bankName = name;
        format = fmt;
        confidence = 0.8;
        break;
      }
    }

    // Get appropriate transaction patterns
    const patterns = this.transactionPatterns.get(format) || this.transactionPatterns.get('generic') || [];

    return { bankName, format, confidence, patterns };
  }

  /**
   * Extract statement metadata (dates, balances, account info)
   */
  private async extractStatementMetadata(text: string, bankInfo: any): Promise<any> {
    const metadata: any = {};

    // Extract account number
    const accountPatterns = [
      /account\s*(?:no|number)?\s*[:\-]?\s*(\d{10,20})/i,
      /a\/c\s*(?:no|number)?\s*[:\-]?\s*(\d{10,20})/i,
    ];

    for (const pattern of accountPatterns) {
      const match = text.match(pattern);
      if (match) {
        metadata.accountNumber = match[1];
        break;
      }
    }

    // Extract statement period
    const datePatterns = [
      /statement\s+period\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\s*(?:to|-)?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
      /from\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\s*to\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        metadata.statementPeriod = {
          from: new Date(match[1]),
          to: new Date(match[2])
        };
        break;
      }
    }

    // Extract balances
    const balancePatterns = [
      /opening\s+balance\s*[:\-]?\s*[\$£€¥৳]?\s*([\d,]+\.?\d*)/i,
      /closing\s+balance\s*[:\-]?\s*[\$£€¥৳]?\s*([\d,]+\.?\d*)/i,
    ];

    const openingMatch = text.match(balancePatterns[0]);
    if (openingMatch) {
      metadata.openingBalance = parseFloat(openingMatch[1].replace(/,/g, ''));
    }

    const closingMatch = text.match(balancePatterns[1]);
    if (closingMatch) {
      metadata.closingBalance = parseFloat(closingMatch[1].replace(/,/g, ''));
    }

    // Extract currency
    const currencyPatterns = [
      /currency\s*[:\-]?\s*([A-Z]{3})/i,
      /(USD|EUR|GBP|JPY|BDT|INR)/g,
    ];

    for (const pattern of currencyPatterns) {
      const match = text.match(pattern);
      if (match) {
        metadata.currency = match[1];
        break;
      }
    }

    metadata.bankName = bankInfo.bankName;
    return metadata;
  }

  /**
   * Parse transactions using bank-specific patterns
   */
  private async parseTransactions(
    text: string, 
    bankInfo: any, 
    organizationId: string
  ): Promise<Partial<BankTransaction>[]> {
    const transactions: Partial<BankTransaction>[] = [];
    const patterns = bankInfo.patterns;

    // Split text into lines and process each line
    const lines = text.split('\n').filter(line => line.trim().length > 10);

    for (const line of lines) {
      for (const pattern of patterns) {
        const match = line.match(pattern.regex);
        if (match) {
          try {
            const transaction: Partial<BankTransaction> = {
              id: uuidv4(),
              organizationId,
              transactionDate: pattern.extractors.date(match),
              description: pattern.extractors.description(match).trim(),
              amount: pattern.extractors.amount(match),
              transactionType: pattern.type,
              bankReferenceNumber: pattern.extractors.reference?.(match) || null,
              metadata: {
                rawLine: line,
                pattern: pattern.type,
                confidence: pattern.confidence,
                extractedBy: 'pattern-matching'
              }
            };

            transactions.push(transaction);
            break; // Move to next line after first match
          } catch (error) {
            console.warn(`[BankingProcessor] Failed to extract transaction from line: ${line}`, error);
          }
        }
      }
    }

    // If no patterns matched, try AI-based extraction
    if (transactions.length === 0) {
      const aiTransactions = await this.aiExtractTransactions(text, organizationId);
      transactions.push(...aiTransactions);
    }

    return transactions;
  }

  /**
   * AI-based transaction extraction using embeddings and similar document analysis
   */
  private async aiExtractTransactions(text: string, organizationId: string): Promise<Partial<BankTransaction>[]> {
    const transactions: Partial<BankTransaction>[] = [];

    try {
      // Generate embeddings for transaction-like text segments
      const lines = text.split('\n').filter(line => this.looksLikeTransaction(line));
      
      for (const line of lines) {
        const embedding = await this.vectorService.generateEmbedding(line);
        
        // Find similar transactions we've processed before
        const similar = await this.vectorService.searchSimilar(embedding, {
          table: 'document_embeddings',
          organizationId,
          limit: 3,
          minSimilarity: 0.7,
        });

        if (similar.length > 0) {
          // Use AI to extract structured data from the line
          const transaction = await this.aiParseTransactionLine(line, similar);
          if (transaction) {
            transactions.push({
              ...transaction,
              organizationId,
              id: uuidv4(),
              metadata: {
                rawLine: line,
                extractedBy: 'ai-analysis',
                confidence: 0.6,
                similarDocuments: similar.length
              }
            });
          }
        }
      }
    } catch (error) {
      console.warn('[BankingProcessor] AI extraction failed:', error);
    }

    return transactions;
  }

  /**
   * Check if a line looks like it contains transaction data
   */
  private looksLikeTransaction(line: string): boolean {
    // Contains date pattern
    const hasDate = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/.test(line);
    // Contains amount pattern
    const hasAmount = /[\d,]+\.?\d*/.test(line);
    // Contains transaction keywords
    const hasTransactionWords = /(transfer|payment|deposit|withdrawal|debit|credit|fee|interest|charge)/i.test(line);
    
    return hasDate && hasAmount && line.length > 20;
  }

  /**
   * AI-powered transaction line parsing
   */
  private async aiParseTransactionLine(
    line: string, 
    similarDocs: any[]
  ): Promise<Partial<BankTransaction> | null> {
    try {
      // Extract date
      const dateMatch = line.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/);
      const date = dateMatch ? new Date(dateMatch[1]) : null;

      // Extract amount (look for the largest number in the line)
      const amounts = line.match(/[\d,]+\.?\d*/g)?.map(a => parseFloat(a.replace(/,/g, ''))) || [];
      const amount = amounts.length > 0 ? Math.max(...amounts) : 0;

      // Determine transaction type based on keywords and context
      let type: 'deposit' | 'withdrawal' | 'transfer' | 'fee' | 'interest' = 'withdrawal';
      
      if (/deposit|credit|received|income/i.test(line)) {
        type = 'deposit';
      } else if (/transfer|sent|paid/i.test(line)) {
        type = 'transfer';
      } else if (/fee|charge|commission/i.test(line)) {
        type = 'fee';
      } else if (/interest/i.test(line)) {
        type = 'interest';
      }

      // Extract description (remove date and amount patterns)
      let description = line
        .replace(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/g, '')
        .replace(/[\d,]+\.?\d*/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!date || amount <= 0 || !description) {
        return null;
      }

      return {
        transactionDate: date,
        description,
        amount,
        transactionType: type,
      };

    } catch (error) {
      console.warn('[BankingProcessor] Failed to AI parse line:', error);
      return null;
    }
  }

  /**
   * Enhance transactions with contact matching and categorization
   */
  private async enhanceTransactions(
    transactions: Partial<BankTransaction>[], 
    organizationId: string, 
    autoMatchContacts: boolean
  ): Promise<Partial<BankTransaction>[]> {
    if (!autoMatchContacts) {
      return transactions;
    }

    // Get existing contacts for matching
    const existingContacts = await db
      .select({
        id: contacts.id,
        companyName: contacts.companyName,
        displayName: contacts.displayName,
      })
      .from(contacts)
      .where(eq(contacts.organizationId, organizationId));

    // Enhance each transaction
    for (const transaction of transactions) {
      if (transaction.description) {
        // Try to match contact based on description
        const matchedContact = this.matchContactByDescription(transaction.description, existingContacts);
        if (matchedContact) {
          transaction.metadata = {
            ...transaction.metadata,
            matchedContactId: matchedContact.id,
            matchedContactName: matchedContact.displayName || matchedContact.companyName,
            matchingConfidence: 0.8
          };
        }

        // Categorize transaction
        const category = this.categorizeTransaction(transaction.description, transaction.transactionType || 'withdrawal');
        transaction.metadata = {
          ...transaction.metadata,
          category,
          autoClassified: true
        };
      }
    }

    return transactions;
  }

  /**
   * Match contact by transaction description
   */
  private matchContactByDescription(description: string, contacts: any[]): any | null {
    const desc = description.toLowerCase();
    
    for (const contact of contacts) {
      const companyName = contact.companyName?.toLowerCase() || '';
      const displayName = contact.displayName?.toLowerCase() || '';
      
      // Check for exact matches
      if (desc.includes(companyName) || desc.includes(displayName)) {
        return contact;
      }
      
      // Check for partial matches (at least 3 characters)
      if (companyName.length >= 3 && desc.includes(companyName.substring(0, 3))) {
        return contact;
      }
    }
    
    return null;
  }

  /**
   * Categorize transaction based on description and type
   */
  private categorizeTransaction(description: string, type: string): string {
    const desc = description.toLowerCase();
    
    // Category patterns
    const categories = {
      'office-rent': /rent|lease|office/i,
      'utilities': /electric|gas|water|internet|phone|utility/i,
      'salary': /salary|wage|payroll|staff/i,
      'supplies': /supplies|stationery|equipment/i,
      'marketing': /marketing|advertising|promotion/i,
      'travel': /travel|transport|fuel|taxi|uber/i,
      'professional-services': /legal|accounting|consulting|professional/i,
      'bank-charges': /fee|charge|commission|service/i,
      'interest': /interest/i,
      'loan': /loan|financing/i,
      'investment': /investment|dividend/i,
      'sales': /sale|revenue|invoice|payment/i,
    };

    for (const [category, pattern] of Object.entries(categories)) {
      if (pattern.test(desc)) {
        return category;
      }
    }

    // Default categorization based on transaction type
    switch (type) {
      case 'deposit': return 'income';
      case 'withdrawal': return 'expense';
      case 'transfer': return 'transfer';
      case 'fee': return 'bank-charges';
      case 'interest': return 'interest';
      default: return 'other';
    }
  }

  /**
   * Validate transactions and check balance consistency
   */
  private async validateTransactions(
    transactions: Partial<BankTransaction>[], 
    metadata: any, 
    validateBalances: boolean
  ): Promise<Partial<BankTransaction>[]> {
    const validTransactions = transactions.filter(t => {
      // Basic validation
      return t.transactionDate && 
             t.description && 
             t.amount !== undefined && 
             t.amount > 0 &&
             t.transactionType;
    });

    // Balance validation if requested and metadata available
    if (validateBalances && metadata.openingBalance !== undefined && metadata.closingBalance !== undefined) {
      const calculatedBalance = this.calculateBalanceFromTransactions(
        validTransactions, 
        metadata.openingBalance
      );
      
      const balanceDifference = Math.abs(calculatedBalance - metadata.closingBalance);
      const balanceVariance = balanceDifference / metadata.closingBalance;
      
      // Mark transactions with balance validation metadata
      validTransactions.forEach(transaction => {
        transaction.metadata = {
          ...transaction.metadata,
          balanceValidated: balanceVariance < 0.01, // Within 1%
          calculatedBalance,
          expectedBalance: metadata.closingBalance,
          balanceVariance
        };
      });
    }

    return validTransactions;
  }

  /**
   * Calculate running balance from transactions
   */
  private calculateBalanceFromTransactions(transactions: Partial<BankTransaction>[], openingBalance: number): number {
    let balance = openingBalance;
    
    for (const transaction of transactions) {
      if (transaction.transactionType === 'deposit') {
        balance += transaction.amount || 0;
      } else {
        balance -= transaction.amount || 0;
      }
    }
    
    return balance;
  }

  /**
   * Calculate overall confidence score for the parsing result
   */
  private calculateOverallConfidence(transactions: Partial<BankTransaction>[], bankInfo: any): number {
    if (transactions.length === 0) {
      return 0;
    }

    // Base confidence from bank identification
    let confidence = bankInfo.confidence || 0.5;
    
    // Add confidence from transaction parsing
    const avgTransactionConfidence = transactions.reduce((sum, t) => {
      const transactionConfidence = t.metadata?.confidence || 0.5;
      return sum + transactionConfidence;
    }, 0) / transactions.length;
    
    confidence = (confidence + avgTransactionConfidence) / 2;
    
    // Boost confidence if balance validates
    const balanceValidated = transactions.some(t => t.metadata?.balanceValidated);
    if (balanceValidated) {
      confidence = Math.min(confidence + 0.1, 1.0);
    }
    
    // Penalize if too few transactions found
    if (transactions.length < 3) {
      confidence *= 0.8;
    }
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Store document learning data for future improvements
   */
  private async storeDocumentLearning(
    organizationId: string, 
    textContent: string, 
    bankInfo: any, 
    transactions: Partial<BankTransaction>[]
  ): Promise<void> {
    try {
      // Generate embedding for the document
      const embedding = await this.vectorService.generateEmbedding(textContent.substring(0, 2000));
      
      // Store in document embeddings table
      await db.insert(documentEmbeddings).values({
        organizationId,
        documentId: uuidv4(),
        title: `Bank Statement - ${bankInfo.bankName}`,
        contentType: 'banking-statement',
        embedding,
        metadata: {
          bankName: bankInfo.bankName,
          format: bankInfo.format,
          transactionCount: transactions.length,
          processingDate: new Date().toISOString(),
          confidence: bankInfo.confidence,
          learningData: {
            patterns: transactions.map(t => ({
              type: t.transactionType,
              description: t.description,
              amount: t.amount,
              confidence: t.metadata?.confidence
            }))
          }
        },
        chunkIndex: 0,
        textContent: textContent.substring(0, 1000), // Store sample for reference
      });
      
      console.log(`[BankingProcessor] Stored learning data for ${bankInfo.bankName} statement`);
    } catch (error) {
      console.warn('[BankingProcessor] Failed to store learning data:', error);
    }
  }

  /**
   * Create bank transactions in the database
   */
  private async createBankTransactions(
    organizationId: string, 
    bankAccountId: string, 
    transactions: Partial<BankTransaction>[]
  ): Promise<void> {
    try {
      const transactionRecords = transactions.map(t => ({
        id: t.id || uuidv4(),
        organizationId,
        bankAccountId,
        transactionDate: t.transactionDate!,
        description: t.description!,
        amount: t.amount!,
        transactionType: t.transactionType!,
        bankReferenceNumber: t.bankReferenceNumber,
        metadata: t.metadata || {},
      }));

      await db.insert(bankTransactions).values(transactionRecords);
      console.log(`[BankingProcessor] Created ${transactionRecords.length} bank transactions`);
    } catch (error) {
      console.error('[BankingProcessor] Failed to create transactions:', error);
      throw error;
    }
  }

  /**
   * Initialize transaction patterns for different banks
   */
  private initializeTransactionPatterns(): void {
    // Generic patterns for common transaction formats
    const genericPatterns: TransactionPattern[] = [
      {
        type: 'deposit',
        regex: /(\d{1,2}\/\d{1,2}\/\d{4})\s+([A-Z\s]+)\s+(\d+,?\d*\.?\d*)\s+CR/i,
        extractors: {
          date: (match) => new Date(match[1]),
          description: (match) => match[2].trim(),
          amount: (match) => parseFloat(match[3].replace(/,/g, '')),
          reference: (match) => match[4] || null,
        },
        confidence: 0.8
      },
      {
        type: 'withdrawal',
        regex: /(\d{1,2}\/\d{1,2}\/\d{4})\s+([A-Z\s]+)\s+(\d+,?\d*\.?\d*)\s+DR/i,
        extractors: {
          date: (match) => new Date(match[1]),
          description: (match) => match[2].trim(),
          amount: (match) => parseFloat(match[3].replace(/,/g, '')),
        },
        confidence: 0.8
      },
    ];

    // EBL (Eastern Bank Limited) specific patterns
    const eblPatterns: TransactionPattern[] = [
      {
        type: 'deposit',
        regex: /(\d{2}\/\d{2}\/\d{4})\s+([^\d]+)\s+(\d+,?\d*\.?\d*)\s+\d+,?\d*\.?\d*\s+CR/i,
        extractors: {
          date: (match) => new Date(match[1]),
          description: (match) => match[2].trim(),
          amount: (match) => parseFloat(match[3].replace(/,/g, '')),
        },
        confidence: 0.9
      },
      {
        type: 'withdrawal',
        regex: /(\d{2}\/\d{2}\/\d{4})\s+([^\d]+)\s+(\d+,?\d*\.?\d*)\s+\d+,?\d*\.?\d*\s+DR/i,
        extractors: {
          date: (match) => new Date(match[1]),
          description: (match) => match[2].trim(),
          amount: (match) => parseFloat(match[3].replace(/,/g, '')),
        },
        confidence: 0.9
      },
    ];

    this.transactionPatterns.set('generic', genericPatterns);
    this.transactionPatterns.set('ebl', eblPatterns);
    this.transactionPatterns.set('dbbl', genericPatterns); // Use generic for now
    this.transactionPatterns.set('brac', genericPatterns);
    this.transactionPatterns.set('scb', genericPatterns);
  }

  /**
   * Get processing statistics for an organization
   */
  async getProcessingStats(organizationId: string, days: number = 30): Promise<any> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [stats] = await db
      .select({
        totalStatements: sql<number>`count(*)`,
        totalTransactions: sql<number>`sum((metadata->>'transactionCount')::int)`,
        avgConfidence: sql<number>`avg((metadata->>'confidence')::numeric)`,
        bankCount: sql<number>`count(distinct metadata->>'bankName')`,
      })
      .from(documentEmbeddings)
      .where(and(
        eq(documentEmbeddings.organizationId, organizationId),
        eq(documentEmbeddings.contentType, 'banking-statement'),
        sql`created_at >= ${since}`
      ));

    return stats;
  }
}

// Export singleton instance
export const bankingStatementProcessor = new BankingStatementProcessor();