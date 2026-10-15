export type TransactionAction = 'SIGNUP_BONUS' | 'DEDUCT_CHAT' | 'DEDUCT_VTON' | 'DEDUCT_MEASUREMENT' | 'REFUND_ERROR';

export interface Transaction {
  txId: string;
  uid: string;
  action: TransactionAction;
  amount: number; // positive for additions/refunds, negative for deductions
  jobId?: string; // Optional correlation ID to a computeQueue job
  timestamp: string;
}
