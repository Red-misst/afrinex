import { createAfrinexAgent } from '@afrinex/agent';
import { DarajaProvider, BuniProvider } from 'afrinex';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();

async function main() {
  console.log("=========================================");
  console.log("[AGENT INIT] Setting up Afrinex Agent...");
  console.log("=========================================\n");

  const env = 'sandbox';

  // Minimal SDK integration
  const daraja = new DarajaProvider({
    consumerKey: process.env.AFRINEX_DARAJA_CONSUMER_KEY!,
    consumerSecret: process.env.AFRINEX_DARAJA_CONSUMER_SECRET!,
    shortcode: process.env.AFRINEX_DARAJA_SHORTCODE!,
    passkey: process.env.AFRINEX_DARAJA_PASSKEY!
  }, env);

  const buni = new BuniProvider({
    consumerKey: process.env.AFRINEX_BUNI_CONSUMER_KEY!,
    consumerSecret: process.env.AFRINEX_BUNI_CONSUMER_SECRET!,
    orgShortCode: process.env.AFRINEX_BUNI_ORG_SHORT_CODE!
  }, env);

  const agent = createAfrinexAgent({
    llm: {
      provider: 'custom',
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseUrl: 'https://api.deepseek.com',
      modelName: 'deepseek-chat'
    },
    approvalThreshold: 5000,
    hitlMode: 'terminal',
    afrinexConfig: {
      env,
      providers: { daraja, buni }
    }
  });

  console.log("[AGENT INIT] Ready. Type 'exit' to quit.\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask = (prompt: string): Promise<string> => 
    new Promise(resolve => rl.question(prompt, resolve));

  while (true) {
    const input = await ask("\nYou: ");
    if (input.trim().toLowerCase() === 'exit') break;

    console.log("\nAgent: ");
    const stream = agent.stream({ messages: [['user', input]] });
    
    let isPendingApproval = false;
    let pendingThreadId = "default-thread"; // Depending on how you handle threadId

    let toolCallStarted = false;

    for await (const chunk of stream) {
      if (chunk?.additional_kwargs?.tool_calls?.length > 0 && !toolCallStarted) {
        process.stdout.write(`\n[Agent is using a tool...]`);
        toolCallStarted = true;
      }

      const text = typeof chunk === 'string' ? chunk : (chunk?.content || '');
      if (text) {
        process.stdout.write(text as string);
      }
    }
    console.log(); // new line after stream

    // Note: The agent.stream does not return the final state directly.
    // If we need to check for HITL, we might need to invoke, or check the graph state.
    // Since stream just streams chat chunks, we can check state via a separate invoke if needed
    // or just rely on the interactive loop for standard queries.
    // For this minimal demo, we'll keep it simple and stream the output.
  }

  rl.close();
}

main().catch(console.error);
