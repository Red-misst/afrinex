import { ChatOpenAI } from '@langchain/openai';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

export interface LlmConfig {
  provider: 'openai' | 'custom';
  apiKey?: string;
  modelName?: string;
  baseUrl?: string;
}

export function createLlm(config: LlmConfig): BaseChatModel {
  if (config.provider === 'openai' || config.provider === 'custom') {
    const opts: any = {
      openAIApiKey: config.apiKey || process.env.OPENAI_API_KEY,
      modelName: config.modelName || 'gpt-4o',
    };
    
    if (config.baseUrl) {
      opts.configuration = { baseURL: config.baseUrl };
    }
    
    return new ChatOpenAI(opts);
  }
  
  throw new Error(`Unsupported LLM provider: ${config.provider}`);
}
