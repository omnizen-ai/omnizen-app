import { pgSchema, customType } from 'drizzle-orm/pg-core';

/**
 * Vectors schema - dedicated schema for pgvector extension
 * This schema contains the vector data type and related operations
 * Created for security best practices (vector extension not in public schema)
 */
export const vectorsSchema = pgSchema('vectors');

/**
 * Custom vector type that properly references the vectors schema
 * This ensures migrations generate vectors.vector(dimensions) instead of just vector(dimensions)
 */
export const vector = customType<{ 
  data: number[]; 
  driverData: string;
  config: { dimensions?: number };
}>({
  dataType(config) {
    const dims = config?.dimensions ?? 1536;
    return `vector(${dims})`;
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
      return value.slice(1, -1).split(',').map(Number);
    }
    return [];
  },
});

// Type definitions for vector operations
export type VectorConfig = {
  dimensions?: number;
};

export type VectorData = number[];