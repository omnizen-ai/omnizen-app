import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { isTestEnvironment } from '../constants';

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': anthropic('claude-3-5-sonnet-20241022'),
        'chat-model-reasoning': wrapLanguageModel({
          model: anthropic('claude-3-5-haiku-20241022'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': anthropic('claude-3-5-haiku-20241022'),
        'artifact-model': anthropic('claude-3-5-sonnet-20241022'),
      },
    });
