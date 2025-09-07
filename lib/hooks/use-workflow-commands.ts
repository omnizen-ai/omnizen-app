import { useState, useEffect } from 'react';

export interface WorkflowCommand {
  command: string;
  description: string;
  type: 'workflow';
}

export function useWorkflowCommands() {
  const [commands, setCommands] = useState<WorkflowCommand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadWorkflows() {
      try {
        const response = await fetch('/api/workflow-commands');
        if (!response.ok) {
          throw new Error('Failed to fetch workflow commands');
        }
        
        const data = await response.json();
        setCommands(data.commands);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load workflows');
        
        // Fallback commands in case of API failure
        setCommands([
          { command: '/work', description: 'General work workflow assistance', type: 'workflow' },
          { command: '/workflow:invoice', description: 'Invoice creation and management workflow', type: 'workflow' },
          { command: '/workflow:payment', description: 'Payment processing and reconciliation workflow', type: 'workflow' },
          { command: '/workflow:reconcile', description: 'Account reconciliation and bank statement matching', type: 'workflow' },
          { command: '/workflow:month-end', description: 'Month-end closing procedures and reporting', type: 'workflow' },
          { command: '/workflow:inventory', description: 'Inventory management and valuation workflow', type: 'workflow' },
          { command: '/workflow:expense', description: 'Expense processing and approval workflow', type: 'workflow' },
          { command: '/workflow:revenue', description: 'Revenue recognition and billing workflow', type: 'workflow' },
        ]);
      } finally {
        setLoading(false);
      }
    }

    loadWorkflows();
  }, []);

  return { commands, loading, error };
}