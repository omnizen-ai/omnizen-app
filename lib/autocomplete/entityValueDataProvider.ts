import type { EntitySearchResult } from '@/lib/hooks/use-entity-search';
import { apiClient } from '@/lib/api/client';

// This creates a data provider for entity values
// It will be used for the second phase of @ mentions (e.g., @customer:john)
export const createEntityValueDataProvider = (entityType: string) => {
  return async (token: string): Promise<(EntitySearchResult & { entityType: string })[]> => {
    if (!token || token.length === 0) {
      return [];
    }

    // Clean the search term - remove the entity type prefix if present
    // e.g., "customer:john" -> "john"
    const cleanedToken = token.includes(':') 
      ? token.split(':').slice(1).join(':') // Handle cases like "customer:sub:value"
      : token;

    if (!cleanedToken || cleanedToken.length === 0) {
      return [];
    }

    try {
      // Make API call to search for entities of this type
      const response = await apiClient.get<{
        success: boolean;
        data: EntitySearchResult[];
        count: number;
      }>('/api/entity-search', {
        entityType,
        searchTerm: cleanedToken,
        limit: 10,
      });

      // Add entityType to each result for easier handling
      return response.data.map(entity => ({
        ...entity,
        entityType
      }));
    } catch (error) {
      console.error(`[EntityValueDataProvider] Error searching ${entityType}:`, error);
      return [];
    }
  };
};