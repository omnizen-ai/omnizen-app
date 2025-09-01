import { useMutation, useQueryClient } from '@tanstack/react-query';

async function deleteChat(chatId: string) {
  const response = await fetch(`/api/chat?id=${chatId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete chat');
  }
  
  return response.json();
}

export function useDeleteChat() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteChat,
    onSuccess: () => {
      // Invalidate chat history to refetch
      queryClient.invalidateQueries({ queryKey: ['chat-history'] });
    },
  });
}