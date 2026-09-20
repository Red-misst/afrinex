import { StateGraph, START, END, MemorySaver } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { agentStateChannels, AgentState } from './state';
import { createTaxTool } from '../tools/tax.tool';
import { createBookkeepingTool } from '../tools/bookkeeping.tool';
import { createTransactionTool } from '../tools/transaction.tool';
import { createBalanceTool } from '../tools/balance.tool';
import { createQueryTool } from '../tools/query.tool';
import { createHitlNode } from './nodes/hitl';
import { createLlm, LlmConfig } from '../providers/llm.provider';
import { tool } from '@langchain/core/tools';
import type { AfrinexConfig } from 'afrinex';
import { ChatOpenAI } from '@langchain/openai';

export interface AfrinexCustomTool<T = any> {
  name: string;
  description: string;
  schema?: any;
  execute: (input: T) => Promise<any> | any;
}

export interface AfrinexAgentOptions {
  llm: LlmConfig;
  afrinexConfig?: AfrinexConfig;
  approvalThreshold?: number;
  customTools?: AfrinexCustomTool[];
  hitlMode?: 'terminal' | 'manual';
}

export function createGraph(options: AfrinexAgentOptions) {
  const approvalThreshold = options.approvalThreshold ?? 10000;
  
  const workflow = new StateGraph<AgentState>({ channels: agentStateChannels as any });

  const llm = createLlm(options.llm) as ChatOpenAI;

  const systemTools = [
    createTaxTool(() => ({} as AgentState)),
    createBookkeepingTool(() => ({} as AgentState)),
    createTransactionTool(() => ({} as AgentState), approvalThreshold, options.afrinexConfig),
    createBalanceTool(() => ({} as AgentState), options.afrinexConfig),
    createQueryTool(() => ({} as AgentState), options.afrinexConfig),
  ];

  const customTools = (options.customTools ?? []).map(t => 
    tool(async (input) => JSON.stringify(await t.execute(input)), {
      name: t.name,
      description: t.description,
      schema: t.schema
    })
  );

  const tools = [...systemTools, ...customTools];
  const toolNode = new ToolNode(tools);
  const llmWithTools = llm.bindTools(tools);

  async function callModel(state: AgentState) {
    const response = await llmWithTools.invoke([
      { role: 'system', content: 'You are a financial agent. Use tools to help the user.' },
      ...state.messages
    ]);
    return { messages: [response] };
  }

  workflow.addNode('agent', callModel as any);
  workflow.addNode('tools', toolNode as any);
  workflow.addNode('hitl', createHitlNode(options.afrinexConfig) as any);

  workflow.addEdge(START, 'agent' as any);
  
  workflow.addConditionalEdges('agent' as any, (state: AgentState) => {
    if (state.humanApproval === 'pending' || state.humanApproval === 'approved' || state.humanApproval === 'rejected') {
      return 'hitl';
    }
    const lastMessage = state.messages[state.messages.length - 1];
    if (lastMessage?.additional_kwargs?.tool_calls?.length) {
      return 'tools';
    }
    return END;
  });

  workflow.addEdge('tools' as any, 'agent' as any);
  workflow.addEdge('hitl' as any, END as any);
  
  const checkpointer = new MemorySaver();
  
  return workflow.compile({ checkpointer });
}
