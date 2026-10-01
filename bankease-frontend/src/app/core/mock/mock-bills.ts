import { Bill, Biller, BillPaymentResponse } from '../models/bill.model';

export const MOCK_BILLERS: Biller[] = [
  {
    id: 1,
    name: 'BSES Rajdhani Power Ltd',
    category: 'ELECTRICITY',
    billerCode: 'ELEC-BSES',
    description: 'Delhi NCT Electricity Distribution',
    active: true
  },
  {
    id: 2,
    name: 'Tata Power DDL',
    category: 'ELECTRICITY',
    billerCode: 'ELEC-TATAPOW',
    description: 'North & Northwest Delhi Electricity',
    active: true
  },
  {
    id: 3,
    name: 'Delhi Jal Board (DJB)',
    category: 'WATER',
    billerCode: 'WAT-DJB',
    description: 'Water & Sewage Utility Services',
    active: true
  },
  {
    id: 4,
    name: 'Airtel Xstream Fiber',
    category: 'INTERNET',
    billerCode: 'NET-AIRTEL',
    description: 'Ultra High-Speed FTTH Broadband',
    active: true
  },
  {
    id: 5,
    name: 'Jio Infocomm Ltd',
    category: 'MOBILE',
    billerCode: 'MOB-JIO',
    description: 'Mobile Postpaid & Prepaid Recharge',
    active: true
  },
  {
    id: 6,
    name: 'Indraprastha Gas Limited (IGL)',
    category: 'ELECTRICITY', // fallback category
    billerCode: 'GAS-IGL',
    description: 'Domestic Piped Natural Gas (PNG)',
    active: true
  }
];

export const MOCK_PENDING_BILLS: Bill[] = [
  {
    id: 101,
    billerId: 1,
    billerName: 'BSES Rajdhani Power Ltd',
    billerCategory: 'ELECTRICITY',
    consumerNumber: '10293847',
    consumerName: 'Ujjawal',
    amount: 2340.00,
    billDate: '2026-09-20',
    dueDate: '2026-10-15',
    status: 'UNPAID'
  },
  {
    id: 102,
    billerId: 4,
    billerName: 'Airtel Xstream Fiber',
    billerCategory: 'INTERNET',
    consumerNumber: '0114567890',
    consumerName: 'Ujjawal',
    amount: 1179.00,
    billDate: '2026-09-22',
    dueDate: '2026-10-10',
    status: 'UNPAID'
  }
];

export const MOCK_BILL_HISTORY: BillPaymentResponse[] = [
  {
    receiptNumber: 'RCPT-20260925-102938',
    billId: 99,
    billerName: 'BSES Rajdhani Power Ltd',
    consumerNumber: '10293847',
    amount: 2180.00,
    paymentDate: '2026-08-25T14:30:45',
    sourceAccountNumber: '100010002486',
    status: 'SUCCESS'
  },
  {
    receiptNumber: 'RCPT-20260812-456789',
    billId: 98,
    billerName: 'Airtel Xstream Fiber',
    consumerNumber: '0114567890',
    amount: 1179.00,
    paymentDate: '2026-08-12T19:20:00',
    sourceAccountNumber: '100010009132',
    status: 'SUCCESS'
  },
  {
    receiptNumber: 'RCPT-20260715-992100',
    billId: 97,
    billerName: 'Delhi Jal Board (DJB)',
    consumerNumber: 'WAT-DEL-8821',
    amount: 640.00,
    paymentDate: '2026-07-15T10:15:30',
    sourceAccountNumber: '100010002486',
    status: 'SUCCESS'
  }
];
