import { createStreamDataTransformer } from 'ai';

/**
 * Filters out intermediate step text from DeepSeek models that should be in thinking blocks
 * These are the "Let me..." messages that appear between tool calls
 */
export function createDeepSeekStreamFilter() {
  const intermediatePatterns = [
    /^(Let me|I'll|I need to|Now let me|First,|Now,|Next,)/i,
    /^(Checking|Looking for|Searching|Getting|Retrieving)/i,
    /^(Let me get|Let me check|Let me query|Let me examine|Let me retrieve)/i,
    /^(I'm going to|I will|Let's)/i,
    /^(Now I'll|Now I need to|Now examining)/i,
  ];

  return createStreamDataTransformer({
    transform: (chunk, controller) => {
      // Check if this is a text chunk
      if (typeof chunk === 'string') {
        // Check if it matches intermediate patterns
        const shouldFilter = intermediatePatterns.some(pattern => 
          pattern.test(chunk.trim())
        );
        
        if (shouldFilter) {
          console.log(`[DeepSeek] Filtered intermediate text: "${chunk.substring(0, 50)}..."`);
          // Don't enqueue this chunk
          return;
        }
      }
      
      // Pass through all other chunks
      controller.enqueue(chunk);
    }
  });
}

/**
 * Alternative approach: Transform intermediate text into thinking blocks
 */
export function transformToThinkingBlocks() {
  const intermediatePatterns = [
    /^(Let me|I'll|I need to|Now let me|First,|Now,|Next,)/i,
    /^(Checking|Looking for|Searching|Getting|Retrieving)/i,
    /^(Let me get|Let me check|Let me query|Let me examine|Let me retrieve)/i,
    /^(I'm going to|I will|Let's)/i,
    /^(Now I'll|Now I need to|Now examining)/i,
  ];

  let buffer = '';
  const isIntermediate = false;

  return createStreamDataTransformer({
    transform: (chunk, controller) => {
      if (typeof chunk === 'string') {
        buffer += chunk;
        
        // Check if this looks like intermediate text
        const lines = buffer.split('\n');
        let processedBuffer = '';
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          
          if (trimmedLine && intermediatePatterns.some(p => p.test(trimmedLine))) {
            // Wrap in thinking tags
            processedBuffer += `<thinking>${line}</thinking>\n`;
          } else {
            processedBuffer += `${line}\n`;
          }
        }
        
        // Keep the last incomplete line in buffer
        const lastNewline = processedBuffer.lastIndexOf('\n');
        if (lastNewline !== -1) {
          controller.enqueue(processedBuffer.substring(0, lastNewline));
          buffer = processedBuffer.substring(lastNewline + 1);
        }
      } else {
        // Pass through non-string chunks
        controller.enqueue(chunk);
      }
    },
    
    flush: (controller) => {
      if (buffer) {
        controller.enqueue(buffer);
      }
    }
  });
}