/**
 * Processes text to extract <thinking> blocks and convert them to reasoning parts
 * This is used as a post-processing step for DeepSeek models
 */
export function processThinkingBlocks(text: string): Array<{ type: 'text' | 'reasoning'; text: string }> {
  const parts: Array<{ type: 'text' | 'reasoning'; text: string }> = [];
  const thinkingPattern = /<thinking>(.*?)<\/thinking>/gs;
  
  let lastIndex = 0;
  let match;
  
  while ((match = thinkingPattern.exec(text)) !== null) {
    // Add text before thinking block
    if (match.index > lastIndex) {
      const textContent = text.slice(lastIndex, match.index).trim();
      if (textContent) {
        parts.push({ type: 'text', text: textContent });
      }
    }
    
    // Add thinking block as reasoning
    const reasoningContent = match[1].trim();
    if (reasoningContent) {
      parts.push({ type: 'reasoning', text: reasoningContent });
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining text
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex).trim();
    if (remainingText) {
      parts.push({ type: 'text', text: remainingText });
    }
  }
  
  // If no parts were extracted, return the original text
  if (parts.length === 0 && text.trim()) {
    parts.push({ type: 'text', text: text });
  }
  
  return parts;
}

/**
 * Creates a transformer that removes <thinking> tags and keeps only the main content
 * This is used for the text stream to avoid showing thinking blocks as regular text
 */
export function createThinkingBlockTransformer() {
  let buffer = '';
  
  return new TransformStream<string, string>({
    transform(chunk, controller) {
      buffer += chunk;
      
      // Process complete thinking blocks
      while (true) {
        const startIdx = buffer.indexOf('<thinking>');
        if (startIdx === -1) {
          // No thinking block start found
          // Check if we might be at the beginning of one
          const lastOpenIdx = buffer.lastIndexOf('<');
          if (lastOpenIdx !== -1 && lastOpenIdx === buffer.length - 1) {
            // Might be start of <thinking>, keep last < in buffer
            const output = buffer.slice(0, lastOpenIdx);
            if (output) controller.enqueue(output);
            buffer = buffer.slice(lastOpenIdx);
            break;
          } else if (lastOpenIdx !== -1 && buffer.slice(lastOpenIdx).startsWith('<thin')) {
            // Partial <thinking> tag, keep it in buffer
            const output = buffer.slice(0, lastOpenIdx);
            if (output) controller.enqueue(output);
            buffer = buffer.slice(lastOpenIdx);
            break;
          } else {
            // No thinking block, output everything
            if (buffer) controller.enqueue(buffer);
            buffer = '';
            break;
          }
        }
        
        // Found <thinking>, look for </thinking>
        const endIdx = buffer.indexOf('</thinking>', startIdx);
        if (endIdx === -1) {
          // No end tag yet, might come in next chunk
          // Output everything before <thinking> and keep the rest in buffer
          if (startIdx > 0) {
            controller.enqueue(buffer.slice(0, startIdx));
          }
          buffer = buffer.slice(startIdx);
          break;
        }
        
        // Found complete thinking block, remove it
        const beforeThinking = buffer.slice(0, startIdx);
        const afterThinking = buffer.slice(endIdx + '</thinking>'.length);
        
        if (beforeThinking) controller.enqueue(beforeThinking);
        buffer = afterThinking;
      }
    },
    
    flush(controller) {
      // Output any remaining content (but not incomplete thinking blocks)
      if (buffer && !buffer.startsWith('<thinking>')) {
        controller.enqueue(buffer);
      }
    }
  });
}

/**
 * Post-processes the accumulated text to extract reasoning blocks
 * and format them properly for the UI
 */
export function extractReasoningFromText(text: string): Array<{ type: 'text' | 'reasoning'; content: string }> {
  const parts: Array<{ type: 'text' | 'reasoning'; content: string }> = [];
  const reasoningPattern = /___REASONING_START___(.*?)___REASONING_END___/gs;
  
  let lastIndex = 0;
  let match;
  
  while ((match = reasoningPattern.exec(text)) !== null) {
    // Add text before reasoning block
    if (match.index > lastIndex) {
      const textContent = text.slice(lastIndex, match.index).trim();
      if (textContent) {
        parts.push({ type: 'text', content: textContent });
      }
    }
    
    // Add reasoning block
    const reasoningContent = match[1].trim();
    if (reasoningContent) {
      parts.push({ type: 'reasoning', content: reasoningContent });
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining text
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex).trim();
    if (remainingText) {
      parts.push({ type: 'text', content: remainingText });
    }
  }
  
  // If no parts were extracted, return the original text
  if (parts.length === 0 && text.trim()) {
    parts.push({ type: 'text', content: text });
  }
  
  return parts;
}