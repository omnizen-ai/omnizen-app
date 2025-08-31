import { experimental_createModelMiddleware } from 'ai';

/**
 * Middleware for DeepSeek models to extract <thinking> blocks
 * and convert them to proper reasoning tokens
 */
export const deepseekMiddleware = experimental_createModelMiddleware({
  transformParams: async ({ params }) => {
    // Pass through params unchanged
    return params;
  },

  wrapGenerate: async ({ doGenerate }) => {
    const result = await doGenerate();
    
    // Process the text to extract thinking blocks
    if (result.text) {
      const processedParts = extractThinkingBlocks(result.text);
      
      // Reconstruct the response with reasoning
      return {
        ...result,
        text: processedParts.filter(p => p.type === 'text').map(p => p.content).join('\n'),
        reasoning: processedParts.filter(p => p.type === 'reasoning').map(p => p.content).join('\n'),
      };
    }
    
    return result;
  },

  wrapStream: async ({ doStream }) => {
    const stream = await doStream();
    let buffer = '';
    let inThinkingBlock = false;
    let thinkingContent = '';
    
    return {
      stream: new ReadableStream({
        async start(controller) {
          const reader = stream.stream.getReader();
          
          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                // Handle any remaining buffer
                if (buffer && !inThinkingBlock) {
                  controller.enqueue({
                    type: 'text-delta',
                    textDelta: buffer,
                  });
                } else if (inThinkingBlock && thinkingContent) {
                  // Emit remaining thinking as reasoning
                  controller.enqueue({
                    type: 'reasoning',
                    reasoning: thinkingContent,
                  });
                }
                controller.close();
                break;
              }
              
              // Process chunks to extract thinking blocks
              if (value.type === 'text-delta') {
                buffer += value.textDelta;
                
                while (buffer.length > 0) {
                  if (!inThinkingBlock) {
                    const thinkingStart = buffer.indexOf('<thinking>');
                    
                    if (thinkingStart !== -1) {
                      // Output text before thinking block
                      if (thinkingStart > 0) {
                        controller.enqueue({
                          type: 'text-delta',
                          textDelta: buffer.slice(0, thinkingStart),
                        });
                      }
                      
                      inThinkingBlock = true;
                      thinkingContent = '';
                      buffer = buffer.slice(thinkingStart + '<thinking>'.length);
                    } else {
                      // Check if we might be at the start of a thinking block
                      const lastOpenIdx = buffer.lastIndexOf('<');
                      if (lastOpenIdx !== -1 && lastOpenIdx > buffer.length - 15) {
                        // Keep potential tag start in buffer
                        const output = buffer.slice(0, lastOpenIdx);
                        if (output) {
                          controller.enqueue({
                            type: 'text-delta',
                            textDelta: output,
                          });
                        }
                        buffer = buffer.slice(lastOpenIdx);
                        break;
                      } else {
                        // Output entire buffer
                        if (buffer) {
                          controller.enqueue({
                            type: 'text-delta',
                            textDelta: buffer,
                          });
                        }
                        buffer = '';
                        break;
                      }
                    }
                  } else {
                    // Inside thinking block, look for end
                    const thinkingEnd = buffer.indexOf('</thinking>');
                    
                    if (thinkingEnd !== -1) {
                      thinkingContent += buffer.slice(0, thinkingEnd);
                      
                      // Emit as reasoning
                      if (thinkingContent.trim()) {
                        controller.enqueue({
                          type: 'reasoning',
                          reasoning: thinkingContent.trim(),
                        });
                      }
                      
                      inThinkingBlock = false;
                      buffer = buffer.slice(thinkingEnd + '</thinking>'.length);
                    } else {
                      // Accumulate thinking content
                      thinkingContent += buffer;
                      buffer = '';
                      break;
                    }
                  }
                }
              } else {
                // Pass through other chunk types
                controller.enqueue(value);
              }
            }
          } catch (error) {
            controller.error(error);
          }
        },
      }),
      ...stream,
    };
  },
});

function extractThinkingBlocks(text: string): Array<{ type: 'text' | 'reasoning'; content: string }> {
  const parts: Array<{ type: 'text' | 'reasoning'; content: string }> = [];
  const thinkingPattern = /<thinking>(.*?)<\/thinking>/gs;
  
  let lastIndex = 0;
  let match;
  
  while ((match = thinkingPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const textContent = text.slice(lastIndex, match.index).trim();
      if (textContent) {
        parts.push({ type: 'text', content: textContent });
      }
    }
    
    const reasoningContent = match[1].trim();
    if (reasoningContent) {
      parts.push({ type: 'reasoning', content: reasoningContent });
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex).trim();
    if (remainingText) {
      parts.push({ type: 'text', content: remainingText });
    }
  }
  
  if (parts.length === 0 && text.trim()) {
    parts.push({ type: 'text', content: text });
  }
  
  return parts;
}