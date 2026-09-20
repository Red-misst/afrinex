import { createGraph, AfrinexAgentOptions, AfrinexCustomTool } from './agent/graph';
import { AgentState } from './agent/state';
import { MemoryAdapter, FsAdapter, AfrinexCacheAdapter } from './cache';

export {
  AfrinexAgentOptions,
  AfrinexCustomTool,
  AgentState,
  MemoryAdapter,
  FsAdapter,
  AfrinexCacheAdapter
};

export interface AfrinexAgent {
  invoke: (state: Partial<AgentState>) => Promise<AgentState>;
  stream: (state: Partial<AgentState>) => AsyncGenerator<any, void, unknown>;
  resume: (action: 'approve' | 'reject', threadId?: string) => Promise<AgentState>;
}

export function createAfrinexAgent(options: AfrinexAgentOptions): AfrinexAgent {
  const graph = createGraph(options);
  const defaultThreadId = "default-thread";

  return {
    async invoke(state: Partial<AgentState>) {
      const config = { configurable: { thread_id: defaultThreadId } };
      return await graph.invoke(state, config);
    },
    
    async *stream(state: Partial<AgentState>) {
      const config = { configurable: { thread_id: defaultThreadId } };
      const stream = await graph.streamEvents(state, { ...config, version: "v2" });
      
      for await (const event of stream) {
        if (event.event === 'on_chat_model_stream') {
          yield event.data.chunk;
        }
      }
    },
    
    async resume(action: 'approve' | 'reject', threadId: string = defaultThreadId) {
      const config = { configurable: { thread_id: threadId } };
      return await graph.invoke({ humanApproval: action }, config);
    }
  };
}
