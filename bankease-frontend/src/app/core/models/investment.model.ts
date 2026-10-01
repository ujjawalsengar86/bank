export type InvestmentType = 'FIXED_DEPOSIT' | 'RECURRING_DEPOSIT' | 'MUTUAL_FUND';
export type InvestmentStatus = 'ACTIVE' | 'MATURED' | 'CLOSED' | 'CANCELLED';

export interface InvestmentProduct {
  id: number;
  name: string;
  investmentType: InvestmentType;
  interestRate: number;
  minAmount: number;
  minTenureMonths: number;
  description: string;
  active: boolean;
}

export interface InvestmentCreateRequest {
  investmentProductId: number;
  productId?: number;
  sourceAccountId: number;
  amount: number;
  tenureMonths: number;
}

export interface Investment {
  id: number;
  investmentNumber: string;
  investmentProductId: number;
  investmentProductName: string;
  investmentType: InvestmentType;
  investedAmount: number;
  interestRate: number;
  tenureMonths: number;
  expectedMaturityAmount: number;
  currentValue: number;
  status: InvestmentStatus;
  startDate: string;
  maturityDate: string;
  sourceAccountNumber: string;
  createdAt: string;
}

export interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  totalReturns: number;
  totalInvestments: number;
  breakdownByType: Record<string, number>;
}

export interface WithdrawRequest {
  destinationAccountId: number;
}
