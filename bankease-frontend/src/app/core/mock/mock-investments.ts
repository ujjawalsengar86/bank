import { Investment, InvestmentProduct, PortfolioSummary } from '../models/investment.model';

export const MOCK_INVESTMENT_PRODUCTS: InvestmentProduct[] = [
  {
    id: 1,
    name: 'SmartGrowth Cumulative Fixed Deposit',
    investmentType: 'FIXED_DEPOSIT',
    interestRate: 7.25,
    minAmount: 10000,
    minTenureMonths: 12,
    description: 'Guaranteed high returns with quarterly compounding and sovereign deposit protection.',
    active: true
  },
  {
    id: 2,
    name: 'Monthly Wealth Builder Recurring Deposit',
    investmentType: 'RECURRING_DEPOSIT',
    interestRate: 6.90,
    minAmount: 1000,
    minTenureMonths: 6,
    description: 'Disciplined monthly savings plan to accumulate wealth for your planned financial goals.',
    active: true
  },
  {
    id: 3,
    name: 'BankEase Bluechip Index Mutual Fund',
    investmentType: 'MUTUAL_FUND',
    interestRate: 12.40,
    minAmount: 5000,
    minTenureMonths: 36,
    description: 'Diversified equity exposure across top 50 national companies for superior inflation-beating growth.',
    active: true
  }
];

export const MOCK_INVESTMENTS: Investment[] = [
  {
    id: 1,
    investmentNumber: 'FD2025021001',
    investmentProductId: 1,
    investmentProductName: 'SmartGrowth Cumulative Fixed Deposit',
    investmentType: 'FIXED_DEPOSIT',
    investedAmount: 100000.00,
    interestRate: 7.25,
    tenureMonths: 12,
    expectedMaturityAmount: 107450.00,
    currentValue: 108500.00,
    status: 'ACTIVE',
    startDate: '2025-02-10',
    maturityDate: '2026-02-10',
    sourceAccountNumber: '100010002486',
    createdAt: '2025-02-10T11:00:00'
  },
  {
    id: 2,
    investmentNumber: 'MF2025051801',
    investmentProductId: 3,
    investmentProductName: 'BankEase Bluechip Index Mutual Fund',
    investmentType: 'MUTUAL_FUND',
    investedAmount: 75000.00,
    interestRate: 12.40,
    tenureMonths: 36,
    expectedMaturityAmount: 106500.00,
    currentValue: 82650.00,
    status: 'ACTIVE',
    startDate: '2025-05-18',
    maturityDate: '2028-05-18',
    sourceAccountNumber: '100010002486',
    createdAt: '2025-05-18T14:30:00'
  },
  {
    id: 3,
    investmentNumber: 'RD2025080101',
    investmentProductId: 2,
    investmentProductName: 'Monthly Wealth Builder Recurring Deposit',
    investmentType: 'RECURRING_DEPOSIT',
    investedAmount: 50000.00,
    interestRate: 6.90,
    tenureMonths: 12,
    expectedMaturityAmount: 53600.00,
    currentValue: 53200.00,
    status: 'ACTIVE',
    startDate: '2025-08-01',
    maturityDate: '2026-08-01',
    sourceAccountNumber: '100010009132',
    createdAt: '2025-08-01T09:00:00'
  }
];

export const MOCK_PORTFOLIO_SUMMARY: PortfolioSummary = {
  totalInvested: 225000.00,
  currentValue: 244350.00,
  totalReturns: 19350.00,
  totalInvestments: 3,
  breakdownByType: {
    'FIXED_DEPOSIT': 108500.00,
    'MUTUAL_FUND': 82650.00,
    'RECURRING_DEPOSIT': 53200.00
  }
};
