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

      return JSON.stringify({
        status: "staged",
        stagedTransaction,
        message: requiresApproval 
          ? `Transaction requires human approval (amount ${amount} > ${approvalThreshold}). It has been staged and paused for review.`
          : `Transaction staged for automatic execution.`
      });
    },
    {
      name: "stage_transaction",
      description: "Stage an STK Push (receive money) or B2C Transfer (send money) for execution via Afrinex. Required before hitting the HITL node.",
      schema: transactionSchema,
    }
  );
};
