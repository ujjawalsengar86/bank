export type LoanType = 'PERSONAL' | 'HOME' | 'EDUCATION' | 'VEHICLE';
export type ApplicationStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
export type LoanStatus = 'ACTIVE' | 'CLOSED' | 'DEFAULTED';

export interface LoanProduct {
  id: number;
  name: string;
  loanType: LoanType;
  interestRate: number;
  minAmount: number;
  maxAmount: number;
  minTenureMonths: number;
  maxTenureMonths: number;
  description: string;
  active: boolean;
}

export interface LoanApplicationRequest {
  loanProductId: number;
  requestedAmount?: number;
  amount?: number;
  tenureMonths: number;
  annualIncome: number;
  purpose: string;
  disbursementAccountId: number;
}

export interface LoanApplication {
  id: number;
  userId: number;
  customerName: string;
  loanProductId: number;
  loanProductName: string;
  loanType: LoanType;
  requestedAmount: number;
  tenureMonths: number;
  annualIncome: number;
  purpose: string;
  status: ApplicationStatus;
  rejectionReason?: string;
  estimatedEmi: number;
  disbursementAccountId?: number;
  createdAt: string;
}

export interface LoanApprovalRequest {
  rejectionReason?: string;
}

export interface Loan {
  id: number;
  loanAccountNumber: string;
  loanProductId: number;
  loanProductName: string;
  loanType: LoanType;
  principalAmount: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  totalPayable: number;
  remainingBalance: number;
  status: LoanStatus;
  startDate: string;
  endDate: string;
  disbursedAccountNumber: string;
}

export interface LoanPaymentRequest {
  sourceAccountId: number;
  amount: number;
}

export interface LoanPaymentResponse {
  receiptNumber?: string;
  paymentId?: number;
  loanId: number;
  loanAccountNumber?: string;
  amount: number;
  principalPortion?: number;
  interestPortion?: number;
  remainingBalance?: number;
  remainingPrincipal?: number;
  installmentNumber?: number;
  paymentDate: string;
  transactionReference?: string;
  status?: string;
}

export interface RepaymentScheduleItem {
  installmentNumber: number;
  dueDate: string;
  emiAmount: number;
  principalPortion: number;
  interestPortion: number;
  balanceAfterPayment: number;
}
