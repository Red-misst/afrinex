import { z } from 'zod';
import { tool } from '@langchain/core/tools';
import { AgentState } from '../agent/state';
import { createClient, AfrinexConfig } from 'afrinex';

export const createBalanceTool = (
  getState: () => AgentState,
  afrinexConfig?: AfrinexConfig
) => {
  const client = afrinexConfig ? createClient(afrinexConfig) : null;
  const availableProviders = client ? client.getProviderNames() : [];

  const providerSchema = availableProviders.length > 0 
    ? z.enum(availableProviders as [string, ...string[]]).describe("Which provider to use")
    : z.string().describe("Which provider to use");

  return tool(
    async ({ provider }) => {
      if (!client) {
        return JSON.stringify({ error: "AfrinexConfig not provided. Cannot fetch live balance from SDK." });
      }

      try {
        const sdkProvider = client.getProvider(provider);
        const res = await sdkProvider.balances();
        return JSON.stringify({
          provider,
          status: "success",
          balance: res.balance,
          currency: res.currency,
          message: res.message
        });
      } catch (err: any) {
        return JSON.stringify({ status: "error", message: err.message });
      }
    },
    {
      name: "get_balance",
      description: "Get the current account balance from the Afrinex SDK.",
      schema: z.object({
        provider: providerSchema
      }),
    }
  );
};

