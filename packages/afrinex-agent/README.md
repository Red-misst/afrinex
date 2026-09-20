# @afrinex/agent

> **The easiest way to add an AI Financial Assistant to your app!**

[![npm version](https://img.shields.io/npm/v/@afrinex/agent)](https://www.npmjs.com/package/@afrinex/agent)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**@afrinex/agent** is an add-on for the `afrinex` SDK. It creates a smart AI chatbot that can securely manage mobile money (M-Pesa) and banking (KCB) accounts by understanding normal human language.

Instead of writing complex code for every button in your app, you can just send text to the AI: 
- *"Check my M-Pesa balance"*
- *"Send 500 shillings to 0712345678"*
- *"Did my KCB transaction go through?"*

---

## 🚀 What can it do?

- **Understand Text**: It converts plain English into real financial transactions.
- **Safety First (Human Approval)**: If the AI tries to send a large amount of money, it will automatically pause and wait for you to click "Approve". It never spends big money without permission!
- **Remember Conversations**: It remembers what you talked about earlier in the chat.
- **Connects Anywhere**: Works perfectly with Safaricom M-Pesa (Daraja) and KCB Bank (Buni).

---

## 🛠️ Step-by-Step Guide for Beginners

Don't worry if you're new to coding! Just follow these steps in order, and you'll have an AI agent working in minutes.

### Step 1: Install the Packages
Open your terminal (command prompt) and run this command in your project folder to install the agent and the SDK:

```bash
npm install @afrinex/agent afrinex dotenv
```

### Step 2: Set up your API Keys
You need passwords (API keys) to connect to Safaricom, KCB, and OpenAI (the brain behind the AI).

Create a new file in your project called `.env` (don't forget the dot at the beginning) and paste this inside. Replace the dots with your actual keys from their developer websites:

```text
# Your OpenAI Key (Get this from platform.openai.com)
OPENAI_API_KEY=sk-proj-...

# Your Safaricom M-Pesa sandbox credentials
AFRINEX_DARAJA_CONSUMER_KEY=...
AFRINEX_DARAJA_CONSUMER_SECRET=...
AFRINEX_DARAJA_SHORTCODE=174379
AFRINEX_DARAJA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919

# Your KCB Buni sandbox credentials
AFRINEX_BUNI_CONSUMER_KEY=...
AFRINEX_BUNI_CONSUMER_SECRET=...
AFRINEX_BUNI_ORG_SHORT_CODE=522522
```

### Step 3: Write your Code
Create a new file called `index.ts` (or `index.js` if you're not using TypeScript), and copy-paste this code:

```typescript
import { createAfrinexAgent } from '@afrinex/agent';
import { DarajaProvider, BuniProvider } from 'afrinex';
import * as dotenv from 'dotenv';

// This loads the passwords from your .env file
dotenv.config();

// Let's create our Safaricom connection
const daraja = new DarajaProvider({
  consumerKey: process.env.AFRINEX_DARAJA_CONSUMER_KEY!,
  consumerSecret: process.env.AFRINEX_DARAJA_CONSUMER_SECRET!,
  shortcode: process.env.AFRINEX_DARAJA_SHORTCODE!,
  passkey: process.env.AFRINEX_DARAJA_PASSKEY!
}, 'sandbox'); // 'sandbox' means testing mode! No real money is used.

// Let's create our KCB connection
const buni = new BuniProvider({
  consumerKey: process.env.AFRINEX_BUNI_CONSUMER_KEY!,
  consumerSecret: process.env.AFRINEX_BUNI_CONSUMER_SECRET!,
  orgShortCode: process.env.AFRINEX_BUNI_ORG_SHORT_CODE!
}, 'sandbox');

// Now, let's create the AI Agent and give it our connections!
const agent = createAfrinexAgent({
  llm: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY, 
    modelName: 'gpt-4o-mini' // The AI brain we are using
  },
  approvalThreshold: 5000,    // Any transfer over 5,000 shillings requires human approval!
  hitlMode: 'terminal',       // Ask for approval in the terminal
  afrinexConfig: {
    env: 'sandbox',
    providers: { daraja, buni } // Give the AI the Safaricom and KCB connections
  }
});

// Let's test it out!
async function runChat() {
  console.log("Asking the AI to check balances...");
  
  const result = await agent.invoke({
    messages: [['user', 'Hi! Can you check my Daraja account balance?']]
  });

  // Print the AI's final answer to the screen
  const aiAnswer = result.messages[result.messages.length - 1].content;
  console.log("AI says:", aiAnswer);
}

runChat();
```

### Step 4: Run it!
Run your file to see the AI in action! 

If you are using TypeScript:
```bash
npx tsx index.ts
```
If you are using Javascript:
```bash
node index.js
```

You should see the AI read your prompt, go check your M-Pesa balance automatically, and reply to you!

---

## 🛡️ What happens if the AI tries to spend too much money?

If a user tells the AI: *"Send 10,000 shillings to my friend"*, the AI will notice that 10,000 is greater than your `approvalThreshold` of 5,000. 

Because we care about safety, the AI will **stop** and ask for a human to approve the transaction.

```typescript
const result = await agent.invoke({
  messages: [['user', 'Send 15000 KES via Buni']]
});

// The AI paused! It wants permission.
if (result.humanApproval === 'pending') {
  console.log("⚠️ Transaction requires your approval!");
  console.log(result.pendingTransaction); // See who is getting the money
  
  // If you want to say YES, tell the AI to continue:
  const finalResult = await agent.resume('approve');
  console.log("AI says:", finalResult.messages[finalResult.messages.length - 1].content);
}
```

---

## 📝 License

MIT © [Isaac Muigai](https://github.com/Red-misst)

