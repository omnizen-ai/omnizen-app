import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel } from './models';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
}

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 1000, // Temporarily increased for testing
    availableChatModelIds: ['chat-model', 'chat-model-reasoning', 'deepseek-chat', 'deepseek-reasoner'],
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 1000,
    availableChatModelIds: ['chat-model', 'chat-model-reasoning', 'deepseek-chat', 'deepseek-reasoner'],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
