export type AccountType = 'SAVINGS' | 'CURRENT';
export type AccountStatus = 'ACTIVE' | 'BLOCKED' | 'CLOSED';

export interface Account {
  id: number;
  userId: number;
  accountHolderName: string;
  userName?: string;
  accountNumber: string;
  accountType: AccountType;
  balance: number;
  currency: string;
  status: AccountStatus;
  branchName?: string;
  ifscCode?: string;
  createdAt: string;
}

export interface BalanceResponse {
  accountId: number;
  accountNumber: string;
  balance: number;
  currentBalance?: number;
  availableBalance?: number;
  currency: string;
}

export interface AccountCreateRequest {
  accountType: AccountType;
  initialDeposit: number;
  userId?: number;
}
