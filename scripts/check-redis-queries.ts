#!/usr/bin/env npx tsx

import { createClient } from 'redis';

async function checkRedisQueries() {
  const client = createClient({ 
    url: process.env.REDIS_URL || 'redis://:myredissecret@localhost:6379' 
  });
  
  try {
    await client.connect();
    console.log('Connected to Redis\n');
    
    // Get all query keys
    const keys = await client.keys('query:*');
    console.log(`Found ${keys.length} query memories:\n`);
    
    // Display each query
    for (const key of keys) {
      const data = await client.get(key);
      if (data) {
        const query = JSON.parse(data);
        console.log(`Key: ${key}`);
        console.log(`Natural: ${query.naturalQuery}`);
        console.log(`SQL: ${query.sqlQuery.substring(0, 100)}...`);
        console.log(`Usage Count: ${query.usageCount}`);
        console.log(`Tables: ${query.tables.join(', ')}`);
        console.log('---\n');
      }
    }
    
    await client.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkRedisQueries();