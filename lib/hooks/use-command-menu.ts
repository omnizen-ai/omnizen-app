import { useState, useCallback, useRef, useEffect } from 'react';

export interface CommandMenuState {
  isOpen: boolean;
  mode: 'slash' | 'mention' | 'mention-value' | null;
  filter: string;
  position: { top: number; left: number };
  triggerPosition: number;
  entityType?: string; // For mention-value mode
}

export function useCommandMenu(textareaRef: React.RefObject<HTMLTextAreaElement>) {
  const [menuState, setMenuState] = useState<CommandMenuState>({
    isOpen: false,
    mode: null,
    filter: '',
    position: { top: 0, left: 0 },
    triggerPosition: 0,
  });

  const closeMenu = useCallback(() => {
    setMenuState(prev => ({
      ...prev,
      isOpen: false,
      mode: null,
      filter: '',
    }));
  }, []);

  const getCaretPosition = useCallback((textarea: HTMLTextAreaElement) => {
    const rect = textarea.getBoundingClientRect();
    const style = window.getComputedStyle(textarea);
    const lineHeight = parseInt(style.lineHeight) || 20;
    
    // Create a temporary div to measure text
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';
    div.style.font = style.font;
    div.style.width = `${textarea.clientWidth}px`;
    div.style.padding = style.padding;
    div.style.border = style.border;
    
    // Get text up to cursor
    const textBeforeCursor = textarea.value.substring(0, textarea.selectionStart);
    div.textContent = textBeforeCursor;
    
    document.body.appendChild(div);
    
    const divRect = div.getBoundingClientRect();
    const lines = Math.floor(divRect.height / lineHeight);
    
    document.body.removeChild(div);
    
    return {
      top: rect.top + (lines * lineHeight) + 25, // Add some offset
      left: rect.left + 10,
    };
  }, []);

  const handleTextChange = useCallback((text: string, cursorPosition: number) => {
    if (!textareaRef.current) return;

    // Look for slash commands - match from start of word, not just at end
    const beforeCursor = text.substring(0, cursorPosition);
    
    // More flexible slash matching - look for /word at start of a "word boundary"
    // Allow colons and other characters in slash commands like /workflow:invoice
    const slashMatch = beforeCursor.match(/(?:^|\s)\/([^\s]*)$/);
    
    // Enhanced mention matching to handle both phases:
    // Phase 1: @word (entity type selection) - also flexible with word boundaries  
    // Phase 2: @entity:value (entity value selection)
    const mentionTypeMatch = beforeCursor.match(/(?:^|\s)@(\w*)$/);
    const mentionValueMatch = beforeCursor.match(/(?:^|\s)@(\w+):([^\s]*)$/);

    if (slashMatch) {
      const filter = slashMatch[1];
      // Adjust trigger position to point to the '/' character specifically
      const matchLength = slashMatch[0].length;
      const slashOffset = slashMatch[0].indexOf('/');
      const triggerPosition = cursorPosition - matchLength + slashOffset;
      const position = getCaretPosition(textareaRef.current);
      
      setMenuState({
        isOpen: true,
        mode: 'slash',
        filter,
        position,
        triggerPosition,
      });
    } else if (mentionValueMatch) {
      // Phase 2: User is typing entity values like @contact:john
      const entityType = mentionValueMatch[1]; // e.g., "contact"
      const filter = mentionValueMatch[2]; // e.g., "john"
      // Adjust trigger position to point to the '@' character specifically
      const matchLength = mentionValueMatch[0].length;
      const atOffset = mentionValueMatch[0].indexOf('@');
      const triggerPosition = cursorPosition - matchLength + atOffset;
      const position = getCaretPosition(textareaRef.current);
      
      setMenuState({
        isOpen: true,
        mode: 'mention-value', // New mode for entity value selection
        filter,
        entityType, // Store the entity type for value lookup
        position,
        triggerPosition,
      });
    } else if (mentionTypeMatch) {
      // Phase 1: User is typing entity types like @contact
      const filter = mentionTypeMatch[1];
      const triggerPosition = cursorPosition - mentionTypeMatch[0].length;
      const position = getCaretPosition(textareaRef.current);
      
      setMenuState({
        isOpen: true,
        mode: 'mention',
        filter,
        position,
        triggerPosition,
      });
    } else {
      closeMenu();
    }
  }, [textareaRef, getCaretPosition, closeMenu]);

  const insertCommand = useCallback((command: string, setText: (text: string) => void, currentText: string) => {
    console.log('insertCommand called:', { command, currentText, menuState });
    
    if (!textareaRef.current) return;
    
    // Get current cursor position
    const currentCursorPosition = textareaRef.current.selectionStart;
    
    // For slash commands, add a space after for better UX
    // For entity type mentions (@contact:), don't add space so user can continue typing
    // For entity value mentions (@contact:John Smith), add a space after for better UX
    const finalCommand = menuState.mode === 'slash' || menuState.mode === 'mention-value' 
      ? `${command} ` 
      : command;
    
    // Replace text from triggerPosition to current cursor position with the selected command
    const beforeTrigger = currentText.substring(0, menuState.triggerPosition);
    const afterCursor = currentText.substring(currentCursorPosition);
    const newText = beforeTrigger + finalCommand + afterCursor;
    
    console.log('Text replacement:', {
      beforeTrigger,
      finalCommand,
      afterCursor,
      newText,
      triggerPosition: menuState.triggerPosition,
      currentCursorPosition
    });
    
    setText(newText);
    
    // Focus and set cursor position after React updates
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPosition = menuState.triggerPosition + finalCommand.length;
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
    
    closeMenu();
  }, [menuState.mode, menuState.triggerPosition, textareaRef, closeMenu]);

  // Close menu when clicking outside (disabled to let CommandMenu handle its own click-outside)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is on the command menu itself
      const target = event.target as HTMLElement;
      if (target.closest('[data-command-menu]')) {
        // Click is on the command menu, don't close
        return;
      }
      
      if (menuState.isOpen && textareaRef.current && !textareaRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuState.isOpen, textareaRef, closeMenu]);

  return {
    menuState,
    closeMenu,
    handleTextChange,
    insertCommand,
  };
}