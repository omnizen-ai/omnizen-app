#!/usr/bin/env npx tsx

import { createClient } from 'redis';

async function checkRedisDetailed() {
  const client = createClient({ 
    url: process.env.REDIS_URL || 'redis://:myredissecret@localhost:6379' 
  });
  
  try {
    await client.connect();
    console.log('Connected to Redis\n');
    console.log('='.repeat(80));
    
    // Get all query keys
    const keys = await client.keys('query:*');
    console.log(`Found ${keys.length} query memories:\n`);
    
    // Check for sensitive patterns
    const sensitivePatterns = [
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, // UUIDs
      /[\w\.-]+@[\w\.-]+\.\w+/g, // Emails
      /11111111-1111-1111-1111-111111111111/g, // Specific org ID
      /anchorblock|bkash|techcorp|acme/gi, // Company names
      /house \d+|road \d+|avenue \d+/gi, // Addresses
      /\+?\d{10,}/g, // Phone numbers
    ];
    
    let hasSensitiveData = false;
    
    // Display each query in detail
    for (const key of keys) {
      const data = await client.get(key);
      if (data) {
        const query = JSON.parse(data);
        console.log(`Key: ${key}`);
        console.log(`Natural Query: "${query.naturalQuery}"`);
        console.log(`SQL Query (first 200 chars): "${query.sqlQuery.substring(0, 200)}..."`);
        console.log(`Tables: ${query.tables.join(', ') || 'none'}`);
        console.log(`Usage Count: ${query.usageCount}`);
        
        // Check for sensitive data
        let foundSensitive = false;
        for (const pattern of sensitivePatterns) {
          if (pattern.test(query.naturalQuery) || pattern.test(query.sqlQuery)) {
            foundSensitive = true;
            hasSensitiveData = true;
            console.log('⚠️  WARNING: Possible sensitive data detected!');
            
            // Reset lastIndex for global regexes
            pattern.lastIndex = 0;
            
            // Show what matched
            const naturalMatches = query.naturalQuery.match(pattern);
            const sqlMatches = query.sqlQuery.match(pattern);
            
            if (naturalMatches) {
              console.log(`   Found in natural query: ${naturalMatches.join(', ')}`);
            }
            if (sqlMatches) {
              console.log(`   Found in SQL: ${sqlMatches.slice(0, 3).join(', ')}${sqlMatches.length > 3 ? '...' : ''}`);
            }
            
            // Reset again for next pattern
            pattern.lastIndex = 0;
          }
        }
        
        if (!foundSensitive) {
          console.log('✅ No sensitive data detected');
        }
        
        console.log('-'.repeat(80));
      }
    }
    
    console.log('\n' + '='.repeat(80));
    if (hasSensitiveData) {
      console.log('⚠️  SUMMARY: Some queries may contain sensitive data!');
      console.log('   Run "npx tsx scripts/clear-redis-queries.ts" to clear all queries');
    } else {
      console.log('✅ SUMMARY: All queries appear to be properly sanitized!');
    }
    
    await client.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkRedisDetailed();