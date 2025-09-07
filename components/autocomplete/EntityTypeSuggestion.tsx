import React from 'react';
import { Hash, User, Building2, Package, ShoppingCart } from 'lucide-react';
import type { EntityType } from '@/lib/hooks/use-entity-search';

interface EntityTypeSuggestionProps {
  entity: EntityType;
  selected: boolean;
}

// Get appropriate icon for entity type
const getEntityIcon = (type: string) => {
  switch (type) {
    case 'customer':
    case 'contact':
      return <User className="w-4 h-4" />;
    case 'vendor':
    case 'supplier':
      return <Building2 className="w-4 h-4" />;
    case 'product':
    case 'item':
      return <Package className="w-4 h-4" />;
    case 'invoice':
      return <Hash className="w-4 h-4" />;
    case 'order':
    case 'sales_order':
      return <ShoppingCart className="w-4 h-4" />;
    default:
      return <Hash className="w-4 h-4" />;
  }
};

export const EntityTypeSuggestion: React.FC<EntityTypeSuggestionProps> = ({ 
  entity, 
  selected 
}) => {
  return (
    <div
      className={`cursor-pointer px-3 py-2 flex items-center ${
        selected ? 'bg-accent text-accent-foreground' : ''
      }`}
    >
      {getEntityIcon(entity.type)}
      <div className="flex flex-col ml-2">
        <span className="font-medium">@{entity.type}:</span>
        <span className="text-xs text-muted-foreground">{entity.displayName}</span>
      </div>
    </div>
  );
};