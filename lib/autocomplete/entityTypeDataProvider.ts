import type { EntityType } from '@/lib/hooks/use-entity-search';

// This will be used inside a component that has access to the entity types
export const createEntityTypeDataProvider = (entityTypes: EntityType[]) => {
  return (token: string): Promise<EntityType[]> => {
    return new Promise((resolve) => {
      // Filter entity types based on the token (what user is typing)
      const filteredTypes = entityTypes.filter(entityType =>
        entityType.type.toLowerCase().includes(token.toLowerCase()) ||
        entityType.displayName.toLowerCase().includes(token.toLowerCase())
      );
      
      // Simulate async behavior to match real API calls
      setTimeout(() => {
        resolve(filteredTypes);
      }, 0);
    });
  };
};