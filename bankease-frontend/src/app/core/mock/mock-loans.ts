import { Loan, LoanApplication, LoanProduct, RepaymentScheduleItem } from '../models/loan.model';

export const MOCK_LOAN_PRODUCTS: LoanProduct[] = [
  {
    id: 1,
    name: 'BankEase Personal Loan',
    loanType: 'PERSONAL',
    interestRate: 10.50,
    minAmount: 50000,
    maxAmount: 1500000,
    minTenureMonths: 12,
    maxTenureMonths: 60,
    description: 'Instant collateral-free retail personal loan for medical, travel, or weddings.',
    active: true
  },
  {
    id: 2,
    name: 'Prime Home Loan',
    loanType: 'HOME',
    interestRate: 8.40,
    minAmount: 500000,
    maxAmount: 10000000,
    minTenureMonths: 36,
    maxTenureMonths: 240,
    description: 'Subsidized interest home purchase, construction, and plot mortgage loan.',
    active: true
  },
  {
    id: 3,
    name: 'Global Scholar Education Loan',
    loanType: 'EDUCATION',
    interestRate: 9.00,
    minAmount: 100000,
    maxAmount: 4000000,
    minTenureMonths: 12,
    maxTenureMonths: 84,
    description: 'Moratorium-supported educational financing for premier Indian and overseas universities.',
    active: true
  },
  {
    id: 4,
    name: 'DriveEase Vehicle Loan',
    loanType: 'VEHICLE',
    interestRate: 9.25,
    minAmount: 100000,
    maxAmount: 2500000,
    minTenureMonths: 12,
    maxTenureMonths: 84,
    description: 'On-road financing up to 90% value for electric, hybrid, and luxury automobiles.',
    active: true
  }
];

export const MOCK_MY_LOANS: Loan[] = [
  {
    id: 101,
    loanAccountNumber: 'LN2026041001',
    loanProductId: 2,
    loanProductName: 'Prime Home Loan',
    loanType: 'HOME',
    principalAmount: 1500000.00,
    interestRate: 8.40,
    tenureMonths: 120,
    emiAmount: 18450.00,
    totalPayable: 2214000.00,
    remainingBalance: 1342800.00,
    status: 'ACTIVE',
    startDate: '2025-04-10',
    endDate: '2035-04-10',
    disbursedAccountNumber: '100010002486'
  }
];

export const MOCK_LOAN_APPLICATIONS: LoanApplication[] = [
  {
    id: 1001,
    userId: 1,
    customerName: 'Ujjawal',
    loanProductId: 1,
    loanProductName: 'BankEase Personal Loan',
    loanType: 'PERSONAL',
    requestedAmount: 250000.00,
    tenureMonths: 24,
    annualIncome: 1200000.00,
    purpose: 'Home renovation and modular kitchen setup',
    status: 'PENDING',
    estimatedEmi: 11590.00,
    disbursementAccountId: 1,
    createdAt: '2026-09-28T11:30:00'
  },
  {
    id: 1002,
    userId: 4,
    customerName: 'Rahul Sharma',
    loanProductId: 4,
    loanProductName: 'DriveEase Vehicle Loan',
    loanType: 'VEHICLE',
    requestedAmount: 850000.00,
    tenureMonths: 48,
    annualIncome: 1400000.00,
    purpose: 'Purchase of new EV 4-wheeler',
    status: 'UNDER_REVIEW',
    estimatedEmi: 21250.00,
    disbursementAccountId: 3,
    createdAt: '2026-09-25T14:15:00'
  },
  {
    id: 1003,
    userId: 5,
    customerName: 'Priya Singh',
    loanProductId: 3,
    loanProductName: 'Global Scholar Education Loan',
    loanType: 'EDUCATION',
    requestedAmount: 1800000.00,
    tenureMonths: 60,
    annualIncome: 950000.00,
    purpose: 'Masters degree program tuition',
    status: 'APPROVED',
    estimatedEmi: 37400.00,
    disbursementAccountId: 4,
    createdAt: '2026-09-15T09:00:00'
  }
];

export const MOCK_REPAYMENT_SCHEDULE: RepaymentScheduleItem[] = [
  { installmentNumber: 1, dueDate: '2026-05-10', emiAmount: 18450, principalPortion: 7950, interestPortion: 10500, balanceAfterPayment: 1492050 },
  { installmentNumber: 2, dueDate: '2026-06-10', emiAmount: 18450, principalPortion: 8005, interestPortion: 10445, balanceAfterPayment: 1484045 },
  { installmentNumber: 3, dueDate: '2026-07-10', emiAmount: 18450, principalPortion: 8061, interestPortion: 10389, balanceAfterPayment: 1475984 },
  { installmentNumber: 4, dueDate: '2026-08-10', emiAmount: 18450, principalPortion: 8118, interestPortion: 10332, balanceAfterPayment: 1467866 },
  { installmentNumber: 5, dueDate: '2026-09-10', emiAmount: 18450, principalPortion: 8175, interestPortion: 10275, balanceAfterPayment: 1459691 },
  { installmentNumber: 6, dueDate: '2026-10-10', emiAmount: 18450, principalPortion: 8232, interestPortion: 10218, balanceAfterPayment: 1451459 },
  { installmentNumber: 7, dueDate: '2026-11-10', emiAmount: 18450, principalPortion: 8290, interestPortion: 10160, balanceAfterPayment: 1443169 },
  { installmentNumber: 8, dueDate: '2026-12-10', emiAmount: 18450, principalPortion: 8348, interestPortion: 10102, balanceAfterPayment: 1434821 }
];
