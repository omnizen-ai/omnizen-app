#!/usr/bin/env npx tsx

import { createClient } from 'redis';

async function clearRedisQueries() {
  const client = createClient({ 
    url: process.env.REDIS_URL || 'redis://:myredissecret@localhost:6379' 
  });
  
  try {
    await client.connect();
    console.log('Connected to Redis\n');
    
    // Get all query keys
    const keys = await client.keys('query:*');
    console.log(`Found ${keys.length} query memories to clear\n`);
    
    if (keys.length > 0) {
      // Delete all query keys
      for (const key of keys) {
        await client.del(key);
        console.log(`Deleted: ${key}`);
      }
      console.log(`\nCleared ${keys.length} query memories from Redis`);
    } else {
      console.log('No query memories to clear');
    }
    
    await client.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

clearRedisQueries();