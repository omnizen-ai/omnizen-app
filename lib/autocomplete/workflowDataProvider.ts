import type { WorkflowCommand } from '@/lib/hooks/use-workflow-commands';

// This will be used inside a component that has access to the workflow commands hook
export const createWorkflowDataProvider = (commands: WorkflowCommand[]) => {
  return (token: string): Promise<WorkflowCommand[]> => {
    return new Promise((resolve) => {
      // Filter commands based on the token (what user is typing)
      const filteredCommands = commands.filter(cmd => 
        cmd.command.toLowerCase().includes(token.toLowerCase()) ||
        cmd.description.toLowerCase().includes(token.toLowerCase())
      );
      
      // Simulate async behavior to match real API calls
      setTimeout(() => {
        resolve(filteredCommands.slice(0, 10)); // Limit to 10 results
      }, 0);
    });
  };
};