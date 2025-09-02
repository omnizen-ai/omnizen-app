# Vector Embeddings & RAG Specification

## Overview
This document outlines the planned implementation of vector embeddings and Retrieval-Augmented Generation (RAG) capabilities for the OmniZen platform, supporting both personal finance and enterprise ERP use cases.

## 1. Document Intelligence Layer

### Personal Users
- **Tax Document Assistant**: Semantic search across tax documents
  - "Find all receipts related to home office expenses from last year"
  - Auto-categorization of tax-deductible expenses
  
- **Financial Memory**: Contextual recall of financial conversations
  - "What did my accountant say about depreciation?"
  - Meeting notes and advisor recommendations
  
- **Receipt Matching**: Intelligent expense categorization
  - Photo → Text extraction → Category suggestion
  - Learning from historical categorization patterns

### Enterprise Users
- **Contract Intelligence**: 
  - "Which contracts have payment terms > 60 days?"
  - Clause extraction and risk analysis
  
- **Compliance Search**: 
  - "Find all documents mentioning GDPR data retention"
  - Policy violation detection
  
- **Vendor Analysis**: 
  - "Show all communications about price increases"
  - Vendor performance tracking through documents
  
- **Audit Trail**: 
  - "Find all documents related to transaction #12345"
  - Complete document chain for any transaction

## 2. Technical Architecture

### Core Schema Design
```sql
-- Document embeddings table
CREATE TABLE document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  workspace_id UUID REFERENCES workspaces(id),
  
  -- Document reference
  document_id UUID NOT NULL,
  storage_path TEXT NOT NULL,  -- Supabase Storage path
  chunk_index INTEGER NOT NULL,
  chunk_total INTEGER NOT NULL,
  
  -- Embedding data
  embedding vector(1536),  -- OpenAI ada-002 dimensions
  content TEXT NOT NULL,    -- Original chunk text
  content_hash TEXT,        -- For deduplication
  
  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',
  -- Expected metadata structure:
  -- {
  --   "title": "Invoice #12345",
  --   "document_type": "invoice",
  --   "extracted_entities": {
  --     "dates": ["2024-01-01"],
  --     "amounts": [1000.00],
  --     "people": ["John Doe"],
  --     "organizations": ["Acme Corp"]
  --   },
  --   "language": "en",
  --   "confidence_scores": {...}
  -- }
  
  -- Categorization
  document_type document_type_enum,
  auto_categories TEXT[],
  user_categories TEXT[],
  
  -- Search optimization
  search_text tsvector GENERATED ALWAYS AS (
    to_tsvector('english', content || ' ' || COALESCE(metadata->>'title', ''))
  ) STORED,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  indexed_at TIMESTAMP,
  
  -- Performance
  CONSTRAINT unique_document_chunk UNIQUE(document_id, chunk_index)
);

-- Indexes for performance
CREATE INDEX idx_embeddings_org ON document_embeddings(organization_id);
CREATE INDEX idx_embeddings_vector ON document_embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);  -- Adjust based on data size
CREATE INDEX idx_embeddings_search ON document_embeddings USING GIN(search_text);
CREATE INDEX idx_embeddings_metadata ON document_embeddings USING GIN(metadata);
```

### Document Processing Pipeline
```
1. Upload to Supabase Storage
   ↓
2. Extract Text (OCR if needed)
   ↓
3. Chunk Document (recursive text splitter)
   ↓
4. Generate Embeddings (OpenAI/local model)
   ↓
5. Store in pgvector with metadata
   ↓
6. Index for hybrid search (vector + full-text)
```

### Integration Points
```sql
-- Link embeddings to existing tables
ALTER TABLE invoices ADD COLUMN embedding_id UUID REFERENCES document_embeddings(id);
ALTER TABLE bills ADD COLUMN embedding_id UUID REFERENCES document_embeddings(id);
ALTER TABLE contracts ADD COLUMN embedding_id UUID REFERENCES document_embeddings(id);
ALTER TABLE journal_entries ADD COLUMN embedding_id UUID REFERENCES document_embeddings(id);
```

## 3. Search & Retrieval Functions

### Similarity Search
```sql
CREATE OR REPLACE FUNCTION search_documents(
  p_organization_id UUID,
  p_query_embedding vector(1536),
  p_match_threshold FLOAT DEFAULT 0.78,
  p_match_count INT DEFAULT 10,
  p_filter_metadata JSONB DEFAULT NULL
) 
RETURNS TABLE (
  document_id UUID,
  content TEXT,
  similarity FLOAT,
  metadata JSONB
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    de.document_id,
    de.content,
    1 - (de.embedding <=> p_query_embedding) AS similarity,
    de.metadata
  FROM document_embeddings de
  WHERE de.organization_id = p_organization_id
    AND 1 - (de.embedding <=> p_query_embedding) > p_match_threshold
    AND (p_filter_metadata IS NULL OR de.metadata @> p_filter_metadata)
  ORDER BY de.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$;
```

### Hybrid Search (Vector + Full-text)
```sql
CREATE OR REPLACE FUNCTION hybrid_search_documents(
  p_organization_id UUID,
  p_query_text TEXT,
  p_query_embedding vector(1536) DEFAULT NULL,
  p_rrf_k INTEGER DEFAULT 60  -- Reciprocal Rank Fusion parameter
)
RETURNS TABLE (
  document_id UUID,
  content TEXT,
  combined_score FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Implementation combines vector similarity and full-text search
  -- Uses Reciprocal Rank Fusion (RRF) for result merging
END;
$$;
```

## 4. Use Case Implementations

### Use Case 1: Receipt Auto-Categorization
```typescript
async function categorizeReceipt(receiptImage: File) {
  // 1. Upload to storage
  const { path } = await uploadToStorage(receiptImage);
  
  // 2. Extract text via OCR
  const text = await extractText(path);
  
  // 3. Generate embedding
  const embedding = await generateEmbedding(text);
  
  // 4. Find similar categorized receipts
  const similar = await searchDocuments({
    embedding,
    filter: { document_type: 'receipt' },
    limit: 5
  });
  
  // 5. Suggest category based on similar receipts
  const suggestedCategory = getMostCommonCategory(similar);
  
  return { text, suggestedCategory, confidence: 0.85 };
}
```

### Use Case 2: Contract Question Answering
```typescript
async function answerContractQuestion(question: string) {
  // 1. Generate question embedding
  const questionEmbedding = await generateEmbedding(question);
  
  // 2. Find relevant contract chunks
  const relevantChunks = await searchDocuments({
    embedding: questionEmbedding,
    filter: { document_type: 'contract' },
    limit: 10
  });
  
  // 3. Build context from chunks
  const context = relevantChunks.map(c => c.content).join('\n');
  
  // 4. Generate answer using RAG
  const answer = await generateAnswer(question, context);
  
  return { answer, sources: relevantChunks };
}
```

## 5. Implementation Phases

### Phase 1: Foundation (v1.0)
- [x] Research pgvector capabilities
- [ ] Enable pgvector extension
- [ ] Create document_embeddings table with RLS
- [ ] Basic document upload and embedding pipeline
- [ ] Simple similarity search API

### Phase 2: Integration (v1.1)
- [ ] Link embeddings to invoices, bills, contracts
- [ ] Auto-categorization for journal entries
- [ ] Semantic search in accounting documents
- [ ] Document deduplication

### Phase 3: Intelligence (v2.0)
- [ ] RAG-powered Q&A on documents
- [ ] Automated document classification
- [ ] Anomaly detection in transactions
- [ ] Multi-language support

### Phase 4: Advanced (v3.0)
- [ ] Multi-modal embeddings (images, PDFs, audio)
- [ ] Temporal embeddings (time-aware search)
- [ ] Knowledge graph construction
- [ ] Predictive insights

## 6. Security & Privacy

### Row Level Security
```sql
-- Embeddings follow same RLS as source documents
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Embeddings tenant isolation" ON document_embeddings
  USING (organization_id = auth_org_id());

CREATE POLICY "Workspace isolation" ON document_embeddings
  USING (workspace_id IS NULL OR workspace_id = auth_workspace_id());
```

### Data Privacy Considerations
- Embeddings stored separately from raw documents
- PII masking before embedding generation
- Audit trail for all document access
- GDPR-compliant deletion cascades

## 7. Performance Optimization

### Indexing Strategy
- IVFFlat index for vectors (good for < 1M vectors)
- HNSW index for larger datasets (> 1M vectors)
- Hybrid approach: full-text + vector search

### Chunking Strategy
- Recursive text splitter with overlap
- Chunk size: 1000 tokens (optimal for context)
- Overlap: 200 tokens (preserve context)

### Caching Strategy
- Cache frequently accessed embeddings
- Pre-compute embeddings for common queries
- Background jobs for embedding generation

## 8. Cost Analysis

### Embedding Generation Costs
- OpenAI ada-002: $0.0001 per 1K tokens
- Average document: 10 chunks × 1K tokens = $0.001
- 10,000 documents = $10 in embedding costs

### Storage Costs
- Vector size: 1536 dimensions × 4 bytes = 6KB
- With metadata: ~10KB per chunk
- 10,000 documents × 10 chunks = 1GB storage

### Computational Costs
- Similarity search: ~1-10ms per query
- Negligible compared to embedding generation

## 9. Success Metrics

### Technical Metrics
- Search latency < 100ms for 95% of queries
- Embedding generation < 2s per document
- Search precision > 90% for known queries

### Business Metrics
- 50% reduction in time to find documents
- 75% accuracy in auto-categorization
- 30% reduction in manual data entry

## 10. Future Enhancements

### Advanced RAG Features
- Chain-of-thought reasoning
- Multi-hop question answering
- Cross-document synthesis
- Real-time learning from feedback

### Integration Possibilities
- Email integration for automatic filing
- SMS/WhatsApp for receipt capture
- Browser extension for web document capture
- Mobile app with camera integration

## Implementation Priority

**High Priority (Implement with current features)**
1. Basic document storage and retrieval
2. Simple categorization for existing features
3. Search within organization documents

**Medium Priority (Next release)**
1. RAG-powered Q&A
2. Auto-extraction from invoices/bills
3. Semantic search across all data

**Low Priority (Future releases)**
1. Advanced AI features
2. Multi-modal support
3. Predictive analytics

---

**Note**: This specification is for future implementation. Current focus should remain on making existing ERP and personal finance features production-ready.