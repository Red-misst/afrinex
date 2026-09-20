import { createAfrinexAgent } from '@afrinex/agent';
import { DarajaProvider, BuniProvider } from 'afrinex';
import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

const checkWeatherTool = {
  name: "check_weather",
  description: "Check the weather for a given city",
  schema: z.object({ city: z.string() }),
  execute: async ({ city }: { city: string }) => {
    return `The weather in ${city} is currently 22°C and sunny.`;
  }
};

async function main() {
  console.log("=========================================");
  console.log("[AGENT INIT] Setting up Afrinex Agent...");
  console.log("=========================================\n");
  
  const env = 'sandbox';

  console.log("[CONFIG] Initializing Daraja Provider...");
  const daraja = new DarajaProvider({
    consumerKey: process.env.AFRINEX_DARAJA_CONSUMER_KEY!,
    consumerSecret: process.env.AFRINEX_DARAJA_CONSUMER_SECRET!,
    shortcode: process.env.AFRINEX_DARAJA_SHORTCODE!,
    passkey: process.env.AFRINEX_DARAJA_PASSKEY!
  }, env);

  console.log("[CONFIG] Initializing Buni Provider...");
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
      providers: {
        daraja,
        buni
      }
    },
    customTools: [checkWeatherTool] 
  });

  console.log("[AGENT INIT] Agent successfully created with providers: daraja, buni\n");

  const runTest = async (testName: string, prompt: string) => {
    console.log(`\n--- Test: ${testName} ---`);
    console.log(`[USER PROMPT]: "${prompt}"`);
    console.log(`[AGENT THINKING] ...`);
    
    const state = await agent.invoke({
      messages: [['user', prompt]]
    });
    
    if (state.humanApproval === 'pending') {
      console.log(`[HITL INTERVENTION] ⚠️ Transaction staged and requires approval!`);
      console.log(`[STAGED TX]:`, JSON.stringify(state.pendingTransaction, null, 2));
      console.log(`[ACTION] Auto-approving for demo purposes...`);
      
      const finalState = await agent.resume('approve');
      console.log(`\n[FINAL AGENT RESPONSE]:\n${finalState.messages[finalState.messages.length - 1].content}`);
    } else {
      console.log(`\n[FINAL AGENT RESPONSE]:\n${state.messages[state.messages.length - 1].content}`);
    }
  };

  await runTest("Get Balances", "Check my Daraja and Buni account balances.");
  await runTest("STK Push (Receive Money)", "Send an STK Push to 0712345678 for 500 KES via Daraja with reference 'Test Push'");
  await runTest("Transfer to Phone (Send Money)", "Transfer 15000 KES to 0722000000 via Buni with reference 'Salary'");
  await runTest("Query Payment Status", "What is the status of the Daraja transaction ID ws_CO_mock_001?");
  
  console.log("\n=========================================");
  console.log("[DEMO COMPLETE]");
  console.log("=========================================\n");
}

main().catch(console.error);

