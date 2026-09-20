import { z } from 'zod';
import { tool } from '@langchain/core/tools';
import { AgentState } from '../agent/state';
import { createClient, AfrinexConfig } from 'afrinex';

export const createQueryTool = (
  getState: () => AgentState,
  afrinexConfig?: AfrinexConfig
) => {
  const client = afrinexConfig ? createClient(afrinexConfig) : null;
  const availableProviders = client ? client.getProviderNames() : [];

  const providerSchema = availableProviders.length > 0 
    ? z.enum(availableProviders as [string, ...string[]]).describe("Which provider to use")
    : z.string().describe("Which provider to use");

  return tool(
    async ({ provider, transactionId }) => {
      if (!client) {
        return JSON.stringify({ error: "AfrinexConfig not provided. Cannot fetch transaction status." });
      }

      try {
        const sdkProvider = client.getProvider(provider);
        const res = await sdkProvider.payments.query({ transactionId });
        return JSON.stringify({
          provider,
          transactionId,
          status: res.status,
          amount: res.amount
        });
      } catch (err: any) {
        return JSON.stringify({ status: "error", message: err.message });
      }
    },
    {
      name: "query_payment",
      description: "Query the status of a specific transaction.",
      schema: z.object({
        provider: providerSchema,
        transactionId: z.string().describe("The checkout request ID or transaction ID")
      }),
    }
  );
};

