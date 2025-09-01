import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Vote } from '@/lib/db/schema';

async function fetchVotes(chatId: string) {
  const response = await fetch(`/api/vote?chatId=${chatId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch votes');
  }
  
  return response.json() as Promise<Array<Vote>>;
}

async function createOrUpdateVote({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  const response = await fetch('/api/vote', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ chatId, messageId, type }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update vote');
  }
  
  return response.json();
}

export function useVotes(chatId: string, enabled = true) {
  return useQuery({
    queryKey: ['votes', chatId],
    queryFn: () => fetchVotes(chatId),
    enabled: enabled && !!chatId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useVoteMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createOrUpdateVote,
    onSuccess: (_, variables) => {
      // Invalidate and refetch votes for the chat
      queryClient.invalidateQueries({ 
        queryKey: ['votes', variables.chatId] 
      });
    },
  });
}