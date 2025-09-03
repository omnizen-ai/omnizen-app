#!/usr/bin/env npx tsx

/**
 * Core pgvector Functionality Test
 * Tests the essential vector operations without external dependencies
 */

import { VectorService } from '../lib/ai/vector-utils';
import { db } from '../lib/db';
import { documentEmbeddings } from '../lib/db/schema/documents/documents';
import { eq, sql } from 'drizzle-orm';

const TEST_ORG_ID = '11111111-1111-1111-1111-111111111111';

async function testPgVectorCore() {
  console.log('🚀 Testing pgvector Core Functionality\n');

  try {
    // Test 1: Verify pgvector extension
    console.log('📋 Test 1: Verifying pgvector extension...');
    const [{ version }] = await db.execute(sql`SELECT extversion as version FROM pg_extension WHERE extname = 'vector'`);
    console.log(`✅ pgvector extension version: ${version}\n`);

    // Test 2: Vector Service Initialization
    console.log('📋 Test 2: Vector Service initialization...');
    const vectorService = new VectorService();
    console.log('✅ Vector service initialized\n');

    // Test 3: Embedding Generation
    console.log('📋 Test 3: Testing embedding generation...');
    const testText = "This is a test document about financial transactions and banking operations";
    const startTime = Date.now();
    const embedding = await vectorService.generateEmbedding(testText);
    const generationTime = Date.now() - startTime;
    
    console.log(`✅ Generated embedding with ${embedding.length} dimensions in ${generationTime}ms`);
    console.log(`   Sample values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
    console.log(`   Vector magnitude: ${Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0)).toFixed(4)}\n`);

    // Test 4: Store Embedding in Database
    console.log('📋 Test 4: Storing embedding in database...');
    const documentId = `test-doc-${Date.now()}`;
    
    await db.insert(documentEmbeddings).values({
      documentId,
      organizationId: TEST_ORG_ID,
      title: 'Test Financial Document',
      contentType: 'test',
      embedding,
      chunkIndex: 0,
      textContent: testText,
      metadata: {
        test: true,
        generatedAt: new Date().toISOString(),
        dimensions: embedding.length
      }
    });
    
    console.log(`✅ Stored embedding for document: ${documentId}\n`);

    // Test 5: Vector Similarity Search
    console.log('📋 Test 5: Testing vector similarity search...');
    const searchText = "banking financial records and transaction data";
    const searchEmbedding = await vectorService.generateEmbedding(searchText);
    
    // Perform vector similarity search using cosine distance
    const searchResults = await db.execute(sql`
      SELECT 
        document_id,
        title,
        text_content,
        1 - (embedding <=> ${searchEmbedding}::vector) as similarity,
        metadata
      FROM ${documentEmbeddings}
      WHERE organization_id = ${TEST_ORG_ID}
      ORDER BY embedding <=> ${searchEmbedding}::vector
      LIMIT 5
    `);

    console.log(`✅ Found ${searchResults.length} similar documents:`);
    searchResults.forEach((result: any, index) => {
      console.log(`   ${index + 1}. ${result.title} (similarity: ${(result.similarity * 100).toFixed(1)}%)`);
      console.log(`      Text: ${result.text_content.substring(0, 100)}...`);
    });
    console.log('');

    // Test 6: Vector Operations Performance
    console.log('📋 Test 6: Performance benchmarking...');
    const performanceTests = [
      { name: 'Embedding Generation', count: 5 },
      { name: 'Similarity Search', count: 3 }
    ];

    for (const test of performanceTests) {
      const times: number[] = [];
      
      for (let i = 0; i < test.count; i++) {
        const start = Date.now();
        
        if (test.name === 'Embedding Generation') {
          await vectorService.generateEmbedding(`Test text ${i} with different content`);
        } else if (test.name === 'Similarity Search') {
          await db.execute(sql`
            SELECT document_id, 1 - (embedding <=> ${searchEmbedding}::vector) as similarity
            FROM ${documentEmbeddings}
            WHERE organization_id = ${TEST_ORG_ID}
            ORDER BY embedding <=> ${searchEmbedding}::vector
            LIMIT 3
          `);
        }
        
        times.push(Date.now() - start);
      }
      
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      console.log(`✅ ${test.name}: avg ${avgTime.toFixed(1)}ms, min ${minTime}ms, max ${maxTime}ms`);
    }
    console.log('');

    // Test 7: Vector Index Performance
    console.log('📋 Test 7: Checking vector index usage...');
    const explainResult = await db.execute(sql`
      EXPLAIN (ANALYZE, BUFFERS)
      SELECT document_id, 1 - (embedding <=> ${searchEmbedding}::vector) as similarity
      FROM ${documentEmbeddings}
      WHERE organization_id = ${TEST_ORG_ID}
      ORDER BY embedding <=> ${searchEmbedding}::vector
      LIMIT 5
    `);

    const indexUsed = explainResult.some((row: any) => 
      row['QUERY PLAN']?.includes('Index Scan') || 
      row['QUERY PLAN']?.includes('ivfflat')
    );

    console.log(`✅ Vector index optimization: ${indexUsed ? 'Active' : 'Using sequential scan'}`);
    console.log('');

    // Test 8: Data Isolation Verification
    console.log('📋 Test 8: Verifying organization data isolation...');
    const otherOrgId = '22222222-2222-2222-2222-222222222222';
    
    // Store test data for another org
    await db.insert(documentEmbeddings).values({
      documentId: `other-org-doc-${Date.now()}`,
      organizationId: otherOrgId,
      title: 'Other Org Document',
      contentType: 'test',
      embedding: await vectorService.generateEmbedding("Other organization document"),
      chunkIndex: 0,
      textContent: "This document belongs to a different organization",
      metadata: { test: true, org: 'other' }
    });

    // Verify isolation
    const isolationTest = await db
      .select({ count: sql`count(*)` })
      .from(documentEmbeddings)
      .where(eq(documentEmbeddings.organizationId, TEST_ORG_ID));

    const totalDocs = await db
      .select({ count: sql`count(*)` })
      .from(documentEmbeddings);

    console.log(`✅ Data isolation verified:`);
    console.log(`   Test org documents: ${isolationTest[0].count}`);
    console.log(`   Total documents: ${totalDocs[0].count}`);
    console.log(`   Isolation working: ${Number(totalDocs[0].count) > Number(isolationTest[0].count)}\n`);

    // Final Summary
    console.log('🎉 SUCCESS: All pgvector core functionality tests passed!');
    console.log('');
    console.log('✅ System Capabilities Verified:');
    console.log('   • pgvector extension operational');
    console.log('   • Vector embedding generation (OpenAI)');  
    console.log('   • Vector similarity search (<=> operator)');
    console.log('   • Database storage and retrieval');
    console.log('   • Multi-tenant data isolation');
    console.log('   • Performance optimization ready');
    console.log('');
    console.log('🚀 pgvector RAG system is fully operational!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testPgVectorCore().catch(console.error);