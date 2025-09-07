import React from 'react';
import { Workflow } from 'lucide-react';
import type { WorkflowCommand } from '@/lib/hooks/use-workflow-commands';

interface WorkflowSuggestionProps {
  entity: WorkflowCommand;
  selected: boolean;
}

export const WorkflowSuggestion: React.FC<WorkflowSuggestionProps> = ({ 
  entity, 
  selected 
}) => {
  return (
    <div
      className={`cursor-pointer px-3 py-2 flex items-center ${
        selected ? 'bg-accent text-accent-foreground' : ''
      }`}
    >
      <Workflow className="w-4 h-4 mr-2 text-muted-foreground" />
      <div className="flex flex-col">
        <span className="font-medium">{entity.command}</span>
        <span className="text-xs text-muted-foreground">{entity.description}</span>
      </div>
    </div>
  );
};