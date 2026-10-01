import { Transaction } from '../models/transaction.model';

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 1,
    referenceNumber: 'TXN20260930102458',
    senderAccountId: 1,
    senderAccountNumber: '100010002486',
    receiverAccountNumber: 'AMZN-PAY-9921',
    transactionType: 'DEPOSIT',
    type: 'DEBIT',
    amount: 3499.00,
    status: 'SUCCESS',
    description: 'Amazon Online Shopping - Electronics',
    createdAt: '2026-09-30T09:15:20'
  },
  {
    id: 2,
    referenceNumber: 'TXN20260928180012',
    senderAccountNumber: 'CORP-SAL-HDFC',
    receiverAccountId: 1,
    receiverAccountNumber: '100010002486',
    transactionType: 'DEPOSIT',
    type: 'CREDIT',
    amount: 65000.00,
    status: 'SUCCESS',
    description: 'Salary Credit - September 2026',
    createdAt: '2026-09-28T18:00:00'
  },
  {
    id: 3,
    referenceNumber: 'TXN20260925143045',
    senderAccountId: 1,
    senderAccountNumber: '100010002486',
    receiverAccountNumber: 'BSES-RAJ-10293847',
    transactionType: 'BILL_PAYMENT',
    type: 'DEBIT',
    amount: 2340.00,
    status: 'SUCCESS',
    description: 'Electricity Bill - BSES Rajdhani',
    createdAt: '2026-09-25T14:30:45'
  },
  {
    id: 4,
    referenceNumber: 'TXN20260922111530',
    senderAccountId: 1,
    senderAccountNumber: '100010002486',
    receiverAccountNumber: '50100234564532',
    transactionType: 'FUND_TRANSFER',
    type: 'DEBIT',
    amount: 5000.00,
    status: 'SUCCESS',
    description: 'UPI Transfer to Rahul Sharma',
    createdAt: '2026-09-22T11:15:30'
  },
  {
    id: 5,
    referenceNumber: 'TXN20260918164010',
    senderAccountNumber: 'TCS-DIV-CORP',
    receiverAccountId: 1,
    receiverAccountNumber: '100010002486',
    transactionType: 'DEPOSIT',
    type: 'CREDIT',
    amount: 1850.00,
    status: 'SUCCESS',
    description: 'Quarterly Dividend Credit - Equities',
    createdAt: '2026-09-18T16:40:10'
  },
  {
    id: 6,
    referenceNumber: 'TXN20260912192000',
    senderAccountId: 2,
    senderAccountNumber: '100010009132',
    receiverAccountNumber: 'AIRTEL-FIBER-011',
    transactionType: 'BILL_PAYMENT',
    type: 'DEBIT',
    amount: 1179.00,
    status: 'SUCCESS',
    description: 'Broadband Bill - Airtel Fiber 200 Mbps',
    createdAt: '2026-09-12T19:20:00'
  },
  {
    id: 7,
    referenceNumber: 'TXN20260905101000',
    senderAccountId: 1,
    senderAccountNumber: '100010002486',
    transactionType: 'WITHDRAWAL',
    type: 'DEBIT',
    amount: 10000.00,
    status: 'SUCCESS',
    description: 'ATM Cash Withdrawal - Connaught Place ATM #04',
    createdAt: '2026-09-05T10:10:00'
  },
  {
    id: 8,
    referenceNumber: 'TXN20260901083015',
    senderAccountId: 1,
    senderAccountNumber: '100010002486',
    receiverAccountNumber: 'SWIGGY-REST-404',
    transactionType: 'DEPOSIT',
    type: 'DEBIT',
    amount: 840.00,
    status: 'SUCCESS',
    description: 'Swiggy Food Delivery Order',
    createdAt: '2026-09-01T08:30:15'
  }
];
