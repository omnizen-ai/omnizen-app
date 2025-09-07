'use client';

import React, { useMemo, useRef, forwardRef } from 'react';
// @ts-ignore - Type definitions may not be perfect
import ReactTextareaAutocomplete from '@webscopeio/react-textarea-autocomplete';
import { useWorkflowCommands } from '@/lib/hooks/use-workflow-commands';
import { useEntityTypes } from '@/lib/hooks/use-entity-search';
import { createWorkflowDataProvider } from '@/lib/autocomplete/workflowDataProvider';
import { createEntityTypeDataProvider } from '@/lib/autocomplete/entityTypeDataProvider';
import { createEntityValueDataProvider } from '@/lib/autocomplete/entityValueDataProvider';
import { WorkflowSuggestion } from './WorkflowSuggestion';
import { EntityTypeSuggestion } from './EntityTypeSuggestion';
import { EntityValueSuggestion } from './EntityValueSuggestion';
import { LoadingComponent } from './LoadingComponent';
import { cn } from '@/lib/utils';

export interface EnhancedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  minHeight?: number;
  maxHeight?: number;
}

export const EnhancedTextarea = forwardRef<HTMLTextAreaElement, EnhancedTextareaProps>(
  ({ 
    value, 
    onChange, 
    placeholder = 'What would you like to know?', 
    className,
    onKeyDown,
    disabled = false,
    minHeight = 48,
    maxHeight = 164,
    ...props 
  }, ref) => {
    // Get data from existing TanStack Query hooks
    const { commands: workflowCommands, loading: workflowLoading } = useWorkflowCommands();
    const { data: entityTypes, isLoading: entityTypesLoading } = useEntityTypes();
    
    // Create data providers using the fetched data
    const workflowDataProvider = useMemo(() => 
      createWorkflowDataProvider(workflowCommands), 
      [workflowCommands]
    );
    
    const entityTypeDataProvider = useMemo(() => 
      createEntityTypeDataProvider(entityTypes || []), 
      [entityTypes]
    );

    // Create a special trigger configuration for react-textarea-autocomplete
    const trigger = useMemo(() => {
      const triggers: any = {};

      // Slash commands trigger
      triggers['/'] = {
        dataProvider: workflowDataProvider,
        component: WorkflowSuggestion,
        output: (item: any) => `${item.command} `,
      };

      // @ mentions trigger (entity types)
      triggers['@'] = {
        dataProvider: entityTypeDataProvider,
        component: EntityTypeSuggestion, 
        output: (item: any) => ({
          text: `@${item.type}:`,
          caretPosition: "end" // Position caret at end without adding space
        }),
      };

      // Dynamic triggers for entity values (@customer:, @vendor:, etc.)
      if (entityTypes) {
        entityTypes.forEach(entityType => {
          const triggerKey = `@${entityType.type}:`;
          triggers[triggerKey] = {
            dataProvider: createEntityValueDataProvider(entityType.type),
            component: EntityValueSuggestion,
            output: (item: any) => `@${item.entityType}:${item.name} `,
          };
        });
      }

      return triggers;
    }, [workflowDataProvider, entityTypeDataProvider, entityTypes]);

    // Handle auto-resize functionality
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
      
      // Auto-resize logic
      const textarea = e.target;
      textarea.style.height = 'auto';
      const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Let the parent handle special key combinations
      if (onKeyDown) {
        onKeyDown(e);
      }
    };

    return (
      <ReactTextareaAutocomplete
        ref={textareaRef}
        className={cn(
          'flex min-h-12 w-full resize-none rounded-3xl border-0 bg-transparent px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        style={{
          minHeight: `${minHeight}px`,
          maxHeight: `${maxHeight}px`,
          overflowY: 'hidden', // Let the component handle overflow
        }}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        trigger={trigger}
        loadingComponent={LoadingComponent}
        containerStyle={{
          position: 'relative',
          zIndex: 50,
        }}
        listStyle={{
          position: 'fixed',
          backgroundColor: 'hsl(var(--popover))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          maxHeight: '256px',
          overflowY: 'auto',
          zIndex: 9999,
          minWidth: '320px',
        }}
        itemStyle={{
          padding: 0, // We handle padding in the components
        }}
        {...props}
      />
    );
  }
);

EnhancedTextarea.displayName = 'EnhancedTextarea';