# @afrinex/agent

> A LangGraph-powered conversational AI agent for seamless financial transactions using the Afrinex SDK.

[![npm version](https://img.shields.io/npm/v/@afrinex/agent)](https://www.npmjs.com/package/@afrinex/agent)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> ⭐️ **If you find this project helpful, please consider leaving a star on [GitHub](https://github.com/Red-misst/afrinex)! It helps others discover the project.**

---

## 📖 The Idea Behind The Agent

Financial applications are traditionally built with rigid, button-heavy interfaces. If a user wants to perform a complex sequence of tasks—like checking their balance, sending money to three different people, and verifying a past transaction—they have to navigate through multiple screens and forms.

**@afrinex/agent** shifts this paradigm by enabling **Conversational Finance**. By bridging the `afrinex` SDK with Large Language Models (LLMs) via LangGraph, this package allows you to build applications where users simply type what they want to do.

**Key Concepts:**
1. **Tool Calling**: The agent translates natural language ("Send 500 to John") into programmatic tool executions using the underlying `afrinex` SDK providers (Daraja, Buni).
2. **Stateful Graph Execution**: Built on `LangGraph`, the agent maintains conversation history and transaction state. It doesn't just execute commands; it can reason, ask clarifying questions, and remember context.
3. **Human-In-The-Loop (HITL)**: AI shouldn't have unrestricted access to money. The agent incorporates a strict safety boundary. Any transaction exceeding a configurable `approvalThreshold` automatically suspends the graph execution and requires explicit human approval before proceeding.

---

## 🏗️ Core Architecture

The agent is built using **LangGraph JS**, framing the workflow as a state machine:

- **Agent State**: Tracks the array of messages, any pending transactions awaiting approval, and the current approval status (`'idle' | 'pending' | 'approved' | 'rejected'`).
- **Nodes**:
  - `agentNode`: The LLM (e.g., OpenAI's GPT-4o) processes the conversation and decides whether to respond directly or invoke a tool.
  - `toolsNode`: Executes the specific financial function (e.g., `daraja_stk_push`).
  - `hitlNode`: A safety interrupt node. If a tool requires spending money above the threshold, execution halts here and waits for external input.
- **Checkpointer**: (Memory) Enables the agent to remember past turns and pause/resume execution mid-graph.

---

## 🚀 Step-by-Step Integration Guide

### 1. Installation

You need both the agent and the base SDK.

```bash
npm install @afrinex/agent afrinex dotenv
```

### 2. Configure Credentials

Create a `.env` file. You will need your payment provider credentials (from Safaricom/KCB) and an LLM provider key (e.g., OpenAI).

```env
# AI Provider
OPENAI_API_KEY=sk-proj-...

# Safaricom Daraja Sandbox
AFRINEX_DARAJA_CONSUMER_KEY=...
AFRINEX_DARAJA_CONSUMER_SECRET=...
AFRINEX_DARAJA_SHORTCODE=174379
AFRINEX_DARAJA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919

# KCB Buni Sandbox
AFRINEX_BUNI_CONSUMER_KEY=...
AFRINEX_BUNI_CONSUMER_SECRET=...
AFRINEX_BUNI_ORG_SHORT_CODE=522522
```

### 3. Initialize the Agent

You must first initialize your SDK providers, then pass them into the agent factory.

```typescript
import { createAfrinexAgent } from '@afrinex/agent';
import { DarajaProvider, BuniProvider } from 'afrinex';
import 'dotenv/config';

// 1. Setup Providers
const daraja = new DarajaProvider({
  consumerKey: process.env.AFRINEX_DARAJA_CONSUMER_KEY!,
  consumerSecret: process.env.AFRINEX_DARAJA_CONSUMER_SECRET!,
  shortcode: process.env.AFRINEX_DARAJA_SHORTCODE!,
  passkey: process.env.AFRINEX_DARAJA_PASSKEY!
}, 'sandbox');

const buni = new BuniProvider({
  consumerKey: process.env.AFRINEX_BUNI_CONSUMER_KEY!,
  consumerSecret: process.env.AFRINEX_BUNI_CONSUMER_SECRET!,
  orgShortCode: process.env.AFRINEX_BUNI_ORG_SHORT_CODE!
}, 'sandbox');

// 2. Create the Agent
const agent = createAfrinexAgent({
  llm: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY!,
    modelName: 'gpt-4o-mini' // Using a fast, reliable model
  },
  approvalThreshold: 1000, // Interrupt if transfer > 1000 KES
  afrinexConfig: {
    env: 'sandbox',
    providers: { daraja, buni }
  }
});
```

### 4. Conversing with the Agent

To talk to the agent, use the `.invoke()` method. Pass in the conversation history.

```typescript
async function chat() {
  // Scenario 1: Information gathering (No money involved)
  const result1 = await agent.invoke({
    messages: [['user', 'What payment providers do you have access to?']]
  });
  console.log("Agent:", result1.messages.at(-1).content);
  
  // Scenario 2: Executing a low-value transaction (Under threshold)
  const result2 = await agent.invoke({
    messages: [['user', 'Send a payment prompt of 50 bob to 0712345678 via Daraja.']]
  });
  console.log("Agent:", result2.messages.at(-1).content);
}
```

### 5. Handling Human-In-The-Loop (HITL)

If a user requests a transaction that exceeds your `approvalThreshold`, the agent will pause its execution graph and return a state where `humanApproval === 'pending'`. 

You must surface this to your UI, wait for the user to click "Approve" or "Reject", and then resume the agent.

```typescript
async function executeHighValue() {
  // Requesting 5000 (exceeds our 1000 threshold)
  const state = await agent.invoke({
    messages: [['user', 'Initiate a 5000 KES transfer to 0712345678 via Buni']]
  });

  if (state.humanApproval === 'pending') {
    console.log("⚠️ APPROVAL REQUIRED ⚠️");
    console.log("Amount:", state.pendingTransaction?.amount);
    console.log("To:", state.pendingTransaction?.phone);
    
    // In a real app, this would be a button click in your frontend.
    // Here, we simulate the user approving it.
    console.log("...User clicked Approve...");
    
    const finalState = await agent.resume('approve');
    console.log("Agent:", finalState.messages.at(-1).content);
  }
}
```

---

## 📚 Comprehensive API Reference

### `createAfrinexAgent(config: AgentConfig)`
Creates a configured agent instance.

**Config Options:**
- `llm`: Object containing `provider` ('openai' or 'anthropic'), `apiKey`, and `modelName`.
- `approvalThreshold`: Number (in KES). Transactions strictly greater than this amount require HITL approval.
- `hitlMode`: `'terminal'` (prompts via CLI, useful for scripts) or `'manual'` (returns pending state for your UI to handle).
- `afrinexConfig`: Object containing `env` and your initialized `providers`.

### Agent Methods
- `agent.invoke(state: Partial<AgentState>, config?: RunnableConfig)`: Sends a message to the agent and executes the graph until completion or interrupt.
- `agent.resume(decision: 'approve' | 'reject')`: Continues the graph execution after a HITL interrupt.

### `AgentState` Structure
```typescript
interface AgentState {
  messages: BaseMessage[];
  humanApproval: 'idle' | 'pending' | 'approved' | 'rejected';
  pendingTransaction: {
    tool: string;
    amount: number;
    phone: string;
    // ...other args
  } | null;
}
```

---

## 🛠️ Guide for Contributors & Forking

If you want to extend the agent's capabilities, add new tools, or change the underlying LangGraph logic, this section is for you.

### Project Structure
```
packages/afrinex-agent/
├── src/
│   ├── agent/        # LangGraph definitions (graph state, nodes, edges)
│   ├── tools/        # Zod schemas and tool definitions mapping LLM args to SDK calls
│   ├── cache/        # Memory implementations (checkpointers)
│   └── index.ts      # Main export
```

### How to Add Custom Tools

The agent maps LLM intentions to code via **Tools**. If you fork this project to add a new feature (e.g., "Check KCB Exchange Rates"), you need to define a new tool.

1. **Define the Schema**: Use `zod` to strictly type the arguments the LLM must provide.
2. **Create the Tool Wrapper**: Use LangChain's `@tool` utility.
3. **Register the Tool**: Add it to the array of tools passed to the `ToolNode` in `src/agent/graph.ts`.

Example:
```typescript
import { z } from "zod";
import { tool } from "@langchain/core/tools";

const getExchangeRateSchema = z.object({
  currency: z.string().describe("The currency code, e.g., USD, EUR"),
});

export const getExchangeRateTool = tool(
  async (input, config) => {
    // 1. Validate input
    // 2. Fetch rate from your internal system or provider
    // 3. Return string result for the LLM to read
    return `The current exchange rate for ${input.currency} is 130 KES.`;
  },
  {
    name: "get_exchange_rate",
    description: "Fetches the current exchange rate for a given foreign currency into KES.",
    schema: getExchangeRateSchema,
  }
);
```

### Modifying the Graph Architecture

The core of the agent lives in `src/agent/graph.ts`. It uses `StateGraph` from `@langchain/langgraph`.

- **Nodes**: If you want to add a new intermediate step (e.g., logging every LLM response to a database), define a new node function and add it via `graph.addNode("logger", loggerNode)`.
- **Edges**: The conditional edge `shouldContinue` determines if the agent should stop, go to a tool, or go to the HITL node. Modify this logic if you want to change the routing behavior (e.g., adding an approval step for *all* tools, not just money transfers).

### Testing the Agent
Testing non-deterministic LLMs requires care. We use Vitest. Ensure you have sandbox credentials and an OpenAI API key in your `.env` to run integration tests.
```bash
npm run test
```

---

## 📜 License

MIT © [Isaac Muigai](https://github.com/Red-misst)
