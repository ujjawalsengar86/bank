import { Beneficiary } from '../models/beneficiary.model';

export const MOCK_BENEFICIARIES: Beneficiary[] = [
  {
    id: 1,
    userId: 1,
    name: 'Rahul Sharma',
    accountNumber: '50100234564532',
    bankName: 'HDFC Bank',
    ifscCode: 'HDFC0001234',
    status: 'ACTIVE',
    createdAt: '2025-02-10T11:00:00'
  },
  {
    id: 2,
    userId: 1,
    name: 'Priya Singh',
    accountNumber: '001105007741',
    bankName: 'ICICI Bank',
    ifscCode: 'ICIC0000011',
    status: 'ACTIVE',
    createdAt: '2025-03-05T14:20:00'
  },
  {
    id: 3,
    userId: 1,
    name: 'Amit Verma',
    accountNumber: '203344556677',
    bankName: 'State Bank of India',
    ifscCode: 'SBIN0000691',
    status: 'ACTIVE',
    createdAt: '2025-04-18T16:40:00'
  },
  {
    id: 4,
    userId: 1,
    name: 'Neha Gupta',
    accountNumber: '918020034455667',
    bankName: 'Axis Bank',
    ifscCode: 'UTIB0000004',
    status: 'ACTIVE',
    createdAt: '2025-05-01T10:15:00'
  }
];
