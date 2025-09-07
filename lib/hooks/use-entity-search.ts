'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export interface EntitySearchResult {
  id: string;
  name: string;
  description?: string;
  type?: string;
  metadata?: Record<string, any>;
}

export interface EntityType {
  type: string;
  displayName: string;
}

// Hook for searching entities
export function useEntitySearch(
  entityType: string,
  searchTerm: string,
  options?: {
    enabled?: boolean;
    limit?: number;
  }
) {
  return useQuery({
    queryKey: ['entity-search', entityType, searchTerm, options?.limit],
    queryFn: () => 
      apiClient.get<{
        success: boolean;
        data: EntitySearchResult[];
        count: number;
      }>('/api/entity-search', {
        entityType,
        searchTerm,
        limit: options?.limit || 10,
      }),
    enabled: options?.enabled ?? (!!entityType && !!searchTerm && searchTerm.length > 0),
    staleTime: 30 * 1000, // 30 seconds
    select: (response) => response.data,
  });
}

// Hook for getting available entity types
export function useEntityTypes() {
  return useQuery({
    queryKey: ['entity-types'],
    queryFn: () => 
      apiClient.get<{
        success: boolean;
        data: EntityType[];
      }>('/api/entity-search', {
        entityType: 'types',
        searchTerm: '',
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes - entity types don't change often
    select: (response) => response.data,
  });
}

// Hook for multi-entity search
export function useMultiEntitySearch(
  entityTypes: string[],
  searchTerm: string,
  options?: {
    enabled?: boolean;
    limit?: number;
  }
) {
  return useQuery({
    queryKey: ['multi-entity-search', entityTypes, searchTerm, options?.limit],
    queryFn: () => 
      apiClient.post<{
        success: boolean;
        data: (EntitySearchResult & { entityType: string })[];
        count: number;
      }>('/api/entity-search', {
        entityTypes,
        searchTerm,
        limit: options?.limit || 10,
      }),
    enabled: options?.enabled ?? (entityTypes.length > 0 && !!searchTerm && searchTerm.length > 0),
    staleTime: 30 * 1000, // 30 seconds
    select: (response) => response.data,
  });
}