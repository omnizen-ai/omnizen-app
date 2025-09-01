import { useInfiniteQuery } from '@tanstack/react-query';
import type { Chat } from '@/lib/db/schema';

export interface ChatHistory {
  chats: Array<Chat>;
  hasMore: boolean;
}

const PAGE_SIZE = 20;

async function fetchChatHistory({ pageParam }: { pageParam: string | null }) {
  const url = pageParam 
    ? `/api/history?ending_before=${pageParam}&limit=${PAGE_SIZE}`
    : `/api/history?limit=${PAGE_SIZE}`;
    
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('Failed to fetch chat history');
  }
  
  return response.json() as Promise<ChatHistory>;
}

export function useChatHistory() {
  return useInfiniteQuery({
    queryKey: ['chat-history'],
    queryFn: fetchChatHistory,
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore) return undefined;
      const lastChat = lastPage.chats.at(-1);
      return lastChat?.id || undefined;
    },
    refetchInterval: false,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}