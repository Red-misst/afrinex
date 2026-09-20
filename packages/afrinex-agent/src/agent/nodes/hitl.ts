import { AgentState } from '../state';
import { createClient, AfrinexConfig } from 'afrinex';

export function createHitlNode(afrinexConfig?: AfrinexConfig) {
  // If config is provided, we can initialize the SDK client
  const client = afrinexConfig ? createClient(afrinexConfig) : null;

  return async function hitlNode(state: AgentState): Promise<Partial<AgentState>> {
    if (state.pendingTransaction && state.humanApproval === 'approved') {
      let resultMessage = 'Transaction approved and executed successfully.';
      
      if (client) {
         try {
           const { action, provider, payload } = state.pendingTransaction;
           const sdkProvider = client.getProvider(provider);
           
           let res;
           if (action === 'stkPush') {
             res = await sdkProvider.stkPush(payload as any);
           } else if (action === 'transfer') {
             res = await sdkProvider.transfers.toPhone(payload as any);
           }
           
           resultMessage = `Transaction executed via Afrinex. Provider response: ${JSON.stringify(res)}`;
         } catch (error: any) {
           resultMessage = `Failed to execute transaction: ${error.message}`;
         }
      } else {
         resultMessage = 'Transaction approved. (Mock execution because AfrinexConfig was not provided)';
      }
      
      return {
        messages: [['assistant', resultMessage]],
        pendingTransaction: undefined,
        humanApproval: undefined
      };
    }
    
    if (state.pendingTransaction && state.humanApproval === 'rejected') {
      return {
        messages: [['assistant', 'Transaction was rejected by human approval.']],
        pendingTransaction: undefined,
        humanApproval: undefined
      };
    }

    // If pending, inject human approval flag to trigger HITL pause check
    return {
      humanApproval: 'pending'
    };
  };
}
