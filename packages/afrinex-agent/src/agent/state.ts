import { BaseMessage } from '@langchain/core/messages';

export interface Transaction {
  id: string;
  type: 'debit' | 'credit' | 'transfer' | 'fee' | 'refund';
  amount: number;
  currency: string;
  provider: 'buni' | 'daraja';
  status: 'pending' | 'success' | 'failed';
  timestamp: string;
  reference?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentState {
  messages: any[];
  transactions: Transaction[];
  ledger?: {
    totalIn: number;
    totalOut: number;
    netPosition: number;
    unreconciled: Transaction[];
    categories: Record<string, Transaction[]>;
  };
  taxSummary?: {
    period: string;
    vatCollected: number;
    vatPaid: number;
    vatOwed: number;
    whtOwed: number;
    eligibleCredits: number;
    flags: string[];
  };
  pendingTransaction?: {
    action: 'stkPush' | 'transfer';
    payload: Record<string, unknown>;
    provider: 'buni' | 'daraja';
    estimatedFee: number;
    requiresApproval: boolean;
    approvalThreshold: number;
  };
  humanApproval?: 'approved' | 'rejected' | 'pending';
  error?: string;
}

export const agentStateChannels = {
  messages: {
    value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
    default: () => [],
  },
  transactions: {
    value: (x: Transaction[], y: Transaction[]) => y,
    default: () => [],
  },
  ledger: {
    value: (x: any, y: any) => y,
    default: () => undefined,
  },
  taxSummary: {
    value: (x: any, y: any) => y,
    default: () => undefined,
  },
  pendingTransaction: {
    value: (x: any, y: any) => y,
    default: () => undefined,
  },
  humanApproval: {
    value: (x: any, y: any) => y,
    default: () => undefined,
  },
  error: {
    value: (x: any, y: any) => y,
    default: () => undefined,
  }
};
