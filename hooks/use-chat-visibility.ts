'use client';

import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { updateChatVisibility } from '@/app/(chat)/actions';
import { useChatHistory } from '@/lib/api/hooks/use-chat-history';
import type { VisibilityType } from '@/components/visibility-selector';

export function useChatVisibility({
  chatId,
  initialVisibilityType,
}: {
  chatId: string;
  initialVisibilityType: VisibilityType;
}) {
  const queryClient = useQueryClient();
  const { data: chatHistory } = useChatHistory();
  
  const { data: localVisibility } = useQuery({
    queryKey: [`${chatId}-visibility`],
    queryFn: () => initialVisibilityType,
    initialData: initialVisibilityType,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const visibilityType = useMemo(() => {
    if (!chatHistory?.pages) return localVisibility;
    const allChats = chatHistory.pages.flatMap(page => page.chats);
    const chat = allChats.find((chat) => chat.id === chatId);
    if (!chat) return localVisibility || 'private';
    return chat.visibility;
  }, [chatHistory, chatId, localVisibility]);

  const setVisibilityType = (updatedVisibilityType: VisibilityType) => {
    queryClient.setQueryData([`${chatId}-visibility`], updatedVisibilityType);
    queryClient.invalidateQueries({ queryKey: ['chat-history'] });

    updateChatVisibility({
      chatId: chatId,
      visibility: updatedVisibilityType,
    });
  };

  return { visibilityType, setVisibilityType };
}
