'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Hash, Workflow, User, Building2, Package, ShoppingCart } from 'lucide-react';
import { useWorkflowCommands, type WorkflowCommand } from '@/lib/hooks/use-workflow-commands';
import { useEntityTypes, useEntitySearch, type EntitySearchResult, type EntityType } from '@/lib/hooks/use-entity-search';

export interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (command: string) => void;
  position: { top: number; left: number };
  filter: string;
  mode: 'slash' | 'mention' | 'mention-value';
  entityType?: string; // For mention-value mode
}

export interface EntitySuggestion {
  type: string;
  value: string;
  label: string;
  icon: React.ReactNode;
}

export function CommandMenu({ isOpen, onClose, onSelect, position, filter, mode, entityType }: CommandMenuProps) {
  const { commands } = useWorkflowCommands();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Real entity data from database
  const { data: availableEntityTypes, isLoading: entityTypesLoading } = useEntityTypes();
  const { data: entityValues, isLoading: entityValuesLoading } = useEntitySearch(
    entityType || '',
    filter,
    { enabled: mode === 'mention-value' && !!entityType && filter.length > 0 }
  );

  // Convert entity types to EntitySuggestion format with proper icons
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

  const entitySuggestions: EntitySuggestion[] = availableEntityTypes?.map(entityType => ({
    type: entityType.type,
    value: entityType.type,
    label: entityType.displayName,
    icon: getEntityIcon(entityType.type)
  })) || [];

  // Filter items based on the current filter text
  const filteredItems = mode === 'slash' 
    ? commands.filter(cmd => 
        cmd.command.toLowerCase().includes(filter.toLowerCase()) ||
        cmd.description.toLowerCase().includes(filter.toLowerCase())
      )
    : mode === 'mention-value' && entityType
    ? (entityValues || []).map(entity => ({
        type: entityType,
        value: entity.name,
        label: entity.name,
        icon: getEntityIcon(entityType),
        description: entity.description,
        metadata: entity.metadata
      }))
    : entitySuggestions.filter(entity =>
        entity.type.toLowerCase().includes(filter.toLowerCase()) ||
        entity.label.toLowerCase().includes(filter.toLowerCase())
      );

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
        break;
      case 'Enter':
      case 'Tab':
        event.preventDefault();
        if (filteredItems[selectedIndex]) {
          const item = filteredItems[selectedIndex];
          if (mode === 'slash') {
            onSelect((item as WorkflowCommand).command);
          } else if (mode === 'mention-value') {
            // For entity values, return the full @entity:value format
            const entity = item as EntitySuggestion;
            onSelect(`@${entity.type}:${entity.value}`);
          } else {
            // For entity types, return @type:
            onSelect(`@${(item as EntitySuggestion).type}:`);
          }
        }
        break;
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
    }
  }, [isOpen, filteredItems, selectedIndex, onSelect, onClose, mode]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Reset selected index when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  if (!isOpen || filteredItems.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        data-command-menu
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="fixed z-50 w-80 max-h-64 overflow-hidden rounded-lg border bg-popover shadow-lg"
        style={{
          top: position.top,
          left: position.left,
        }}
      >
        <Command className="w-full">
          <CommandList className="max-h-60 overflow-y-auto">
            {mode === 'slash' ? (
              <CommandGroup heading="Workflows">
                {filteredItems.map((command, index) => {
                  const cmd = command as WorkflowCommand;
                  return (
                    <CommandItem
                      key={cmd.command}
                      value={cmd.command}
                      className={`cursor-pointer px-3 py-2 ${
                        index === selectedIndex ? 'bg-accent text-accent-foreground' : ''
                      }`}
                      onSelect={(value) => {
                        console.log('CommandItem onSelect called with:', value);
                        onSelect(value);
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        console.log('CommandItem onClick called with:', cmd.command);
                        onSelect(cmd.command);
                      }}
                    >
                      <Workflow className="w-4 h-4 mr-2 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="font-medium">{cmd.command}</span>
                        <span className="text-xs text-muted-foreground">{cmd.description}</span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ) : mode === 'mention-value' ? (
              <CommandGroup heading={`${entityType?.charAt(0).toUpperCase()}${entityType?.slice(1)} Values`}>
                {filteredItems.map((suggestion, index) => {
                  const entity = suggestion as EntitySuggestion;
                  return (
                    <CommandItem
                      key={entity.value}
                      value={entity.value}
                      className={`cursor-pointer px-3 py-2 ${
                        index === selectedIndex ? 'bg-accent text-accent-foreground' : ''
                      }`}
                      onSelect={(value) => {
                        const fullValue = `@${entity.type}:${entity.value}`;
                        console.log('Entity Value CommandItem onSelect called with:', fullValue);
                        onSelect(fullValue);
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        const fullValue = `@${entity.type}:${entity.value}`;
                        console.log('Entity Value CommandItem onClick called with:', fullValue);
                        onSelect(fullValue);
                      }}
                    >
                      {entity.icon}
                      <div className="flex flex-col ml-2">
                        <span className="font-medium">{entity.value}</span>
                        {entity.description && (
                          <span className="text-xs text-muted-foreground">{entity.description}</span>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ) : (
              <CommandGroup heading="Entity Types">
                {filteredItems.map((suggestion, index) => {
                  const entity = suggestion as EntitySuggestion;
                  const entityValue = `@${entity.type}:`;
                  return (
                    <CommandItem
                      key={entity.type}
                      value={entityValue}
                      className={`cursor-pointer px-3 py-2 ${
                        index === selectedIndex ? 'bg-accent text-accent-foreground' : ''
                      }`}
                      onSelect={(value) => {
                        console.log('Entity CommandItem onSelect called with:', value);
                        onSelect(value);
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        console.log('Entity CommandItem onClick called with:', entityValue);
                        onSelect(entityValue);
                      }}
                    >
                      {entity.icon}
                      <div className="flex flex-col ml-2">
                        <span className="font-medium">@{entity.type}:</span>
                        <span className="text-xs text-muted-foreground">{entity.label}</span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
            {filteredItems.length === 0 && (
              <CommandEmpty>
                {(mode === 'mention' && entityTypesLoading) || (mode === 'mention-value' && entityValuesLoading)
                  ? 'Loading...'
                  : `No ${mode === 'slash' ? 'commands' : mode === 'mention-value' ? 'results' : 'entity types'} found.`
                }
              </CommandEmpty>
            )}
          </CommandList>
        </Command>
      </motion.div>
    </AnimatePresence>
  );
}