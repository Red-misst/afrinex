import { z } from 'zod';
import { tool } from '@langchain/core/tools';
import { AgentState } from '../agent/state';
import { createClient, AfrinexConfig } from 'afrinex';

export const createTransactionTool = (
  getState: () => AgentState,
  approvalThreshold: number = 10000,
  afrinexConfig?: AfrinexConfig
) => {
  const client = afrinexConfig ? createClient(afrinexConfig) : null;
  const availableProviders = client ? client.getProviderNames() : [];

  const providerSchema = availableProviders.length > 0 
    ? z.enum(availableProviders as [string, ...string[]]).describe("Which provider to use")
    : z.string().describe("Which provider to use");

  const transactionSchema = z.object({
    action: z.enum(['stkPush', 'transfer']).describe("The type of transaction: 'stkPush' to receive money from a user, 'transfer' to send money to a user (B2C)."),
    phone: z.string().describe("The phone number to push to or send to, e.g., '0712345678'"),
    amount: z.number().describe("The amount in KES"),
    provider: providerSchema,
    reference: z.string().describe("An account reference or reason for the transaction")
  });

  return tool(
    async ({ action, phone, amount, provider, reference }) => {
      const requiresApproval = amount > approvalThreshold;
      
      const stagedTransaction = {
        action,
        payload: {
          phone,
          amount,
          reference,
          description: reference
        },
        provider,
        estimatedFee: 0,
        requiresApproval,
        approvalThreshold
      };

      if (!requiresApproval) {
        if (!client) {
          return JSON.stringify({ error: "AfrinexConfig not provided. Cannot execute transaction automatically." });
        }
        
        try {
          const sdkProvider = client.getProvider(provider);
          let res;
          if (action === 'stkPush') {
            res = await sdkProvider.stkPush({ phone, amount, reference, description: reference });
          } else if (action === 'transfer') {
            res = await sdkProvider.transfers.toPhone({ phone, amount, reference, description: reference });
          }
          
          return JSON.stringify({
            status: "executed",
            executedTransaction: res,
            message: `Transaction executed automatically (amount ${amount} <= ${approvalThreshold}). Provider response: ${JSON.stringify(res)}`
          });
        } catch (error: any) {
          return JSON.stringify({
            status: "error",
            message: `Failed to execute transaction: ${error.message}`
          });
        }
      }

      return JSON.stringify({
        status: "staged",
        stagedTransaction,
        message: `Transaction requires human approval (amount ${amount} > ${approvalThreshold}). It has been staged and paused for review.`
      });
    },
    {
      name: "stage_transaction",
      description: "Stage an STK Push (receive money) or B2C Transfer (send money) for execution via Afrinex. Required before hitting the HITL node.",
      schema: transactionSchema,
    }
  );
};
