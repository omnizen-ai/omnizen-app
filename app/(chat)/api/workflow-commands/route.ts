import { NextRequest } from 'next/server';
import { getAvailableWorkflows } from '@/lib/ai/workflow-prompts';

export async function GET(request: NextRequest) {
  try {
    const workflows = await getAvailableWorkflows();
    
    // Transform workflows into command format
    const commands = workflows.map(workflow => ({
      command: `/workflow:${workflow}`,
      description: getWorkflowDescription(workflow),
      type: 'workflow' as const
    }));
    
    // Add the basic /work command
    commands.unshift({
      command: '/work',
      description: 'General work workflow assistance',
      type: 'workflow'
    });
    
    return Response.json({ commands });
  } catch (error) {
    console.error('Failed to fetch workflow commands:', error);
    
    // Return fallback commands if Redis is unavailable
    const fallbackCommands = [
      { command: '/work', description: 'General work workflow assistance', type: 'workflow' },
      { command: '/workflow:invoice', description: 'Invoice creation and management workflow', type: 'workflow' },
      { command: '/workflow:payment', description: 'Payment processing and reconciliation workflow', type: 'workflow' },
      { command: '/workflow:reconcile', description: 'Account reconciliation and bank statement matching', type: 'workflow' },
      { command: '/workflow:month-end', description: 'Month-end closing procedures and reporting', type: 'workflow' },
      { command: '/workflow:inventory', description: 'Inventory management and valuation workflow', type: 'workflow' },
      { command: '/workflow:expense', description: 'Expense processing and approval workflow', type: 'workflow' },
      { command: '/workflow:revenue', description: 'Revenue recognition and billing workflow', type: 'workflow' },
    ];
    
    return Response.json({ commands: fallbackCommands });
  }
}

function getWorkflowDescription(workflow: string): string {
  const descriptions: Record<string, string> = {
    'invoice': 'Invoice creation and management workflow',
    'payment': 'Payment processing and reconciliation workflow',
    'reconcile': 'Account reconciliation and bank statement matching',
    'month-end': 'Month-end closing procedures and reporting',
    'inventory': 'Inventory management and valuation workflow',
    'expense': 'Expense processing and approval workflow',
    'revenue': 'Revenue recognition and billing workflow'
  };
  
  return descriptions[workflow] || `${workflow} workflow assistance`;
}