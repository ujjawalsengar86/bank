export type TransactionType =
  | 'FUND_TRANSFER'
  | 'BILL_PAYMENT'
  | 'LOAN_PAYMENT'
  | 'INVESTMENT'
  | 'DEPOSIT'
  | 'WITHDRAWAL';

export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REVERSED';

export interface Transaction {
  id: number;
  referenceNumber?: string;
  accountId?: number;
  senderAccountId?: number;
  senderAccountNumber?: string;
  receiverAccountId?: number;
  receiverAccountNumber?: string;
  transactionType?: TransactionType;
  type?: string;
  accountNumber?: string;
  amount: number;
  balanceAfter?: number;
  transactionReference?: string;
  status: TransactionStatus;
  description?: string;
  createdAt: string;
}

export interface TransactionFilter {
  accountId?: number;
  type?: TransactionType;
  status?: TransactionStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}
