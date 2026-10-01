import { Account } from '../models/account.model';

export const MOCK_ACCOUNTS: Account[] = [
  {
    id: 1,
    userId: 1,
    accountHolderName: 'Ujjawal',
    userName: 'Ujjawal',
    accountNumber: '100010002486',
    accountType: 'SAVINGS',
    balance: 185650.00,
    currency: 'INR',
    status: 'ACTIVE',
    branchName: 'Connaught Place Branch, New Delhi',
    ifscCode: 'BANE0001001',
    createdAt: '2025-01-15T10:00:00'
  },
  {
    id: 2,
    userId: 1,
    accountHolderName: 'Ujjawal',
    userName: 'Ujjawal',
    accountNumber: '100010009132',
    accountType: 'CURRENT',
    balance: 63000.00,
    currency: 'INR',
    status: 'ACTIVE',
    branchName: 'Bandra Kurla Complex, Mumbai',
    ifscCode: 'BANE0002004',
    createdAt: '2025-02-01T12:30:00'
  },
  {
    id: 3,
    userId: 4,
    accountHolderName: 'Rahul Sharma',
    userName: 'Rahul Sharma',
    accountNumber: '100010004532',
    accountType: 'SAVINGS',
    balance: 94200.00,
    currency: 'INR',
    status: 'ACTIVE',
    branchName: 'Indiranagar Branch, Bengaluru',
    ifscCode: 'BANE0003009',
    createdAt: '2025-03-22T09:15:00'
  },
  {
    id: 4,
    userId: 5,
    accountHolderName: 'Priya Singh',
    userName: 'Priya Singh',
    accountNumber: '100010007741',
    accountType: 'SAVINGS',
    balance: 12500.00,
    currency: 'INR',
    status: 'BLOCKED',
    branchName: 'Sector 18, Noida',
    ifscCode: 'BANE0001088',
    createdAt: '2025-04-10T15:20:00'
  }
];
