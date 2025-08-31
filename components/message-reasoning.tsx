'use client';

import { Reasoning, ReasoningTrigger, ReasoningContent } from './elements/reasoning';

interface MessageReasoningProps {
  isLoading: boolean;
  reasoning: string;
}

export function MessageReasoning({
  isLoading,
  reasoning,
}: MessageReasoningProps) {
  // Extract the latest line of reasoning for preview
  const latestReasoning = reasoning
    .split('\n')
    .filter(line => line.trim())
    .pop() || 'Processing...';
  
  return (
    <Reasoning 
      isStreaming={isLoading} 
      defaultOpen={false}
      data-testid="message-reasoning"
      reasoning={latestReasoning}
    >
      <ReasoningTrigger />
      <ReasoningContent>{reasoning}</ReasoningContent>
    </Reasoning>
  );
}
