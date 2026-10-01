import { NotificationItem } from '../models/notification.model';

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    title: 'Fund Transfer Successful',
    message: 'Your transfer of ₹5,000 to Rahul Sharma (HDFC Bank) was processed and settled successfully.',
    type: 'TRANSACTION',
    read: false,
    createdAt: '2026-09-30T09:15:00'
  },
  {
    id: 2,
    title: 'Utility Bill Payment Received',
    message: 'Your electricity bill of ₹2,340 for BSES Rajdhani was paid successfully. Biller ref: ELEC-BSES-102938.',
    type: 'TRANSACTION',
    read: false,
    createdAt: '2026-09-25T14:31:00'
  },
  {
    id: 3,
    title: 'Loan Credit Assessment',
    message: 'Your personal loan application #1001 for ₹2,50,000 is currently under credit review by our underwriting desk.',
    type: 'LOAN',
    read: false,
    createdAt: '2026-09-28T12:00:00'
  },
  {
    id: 4,
    title: 'Security Advisory: New Session',
    message: 'A new web banking session was initiated from Chrome on Windows (IP 127.0.0.1).',
    type: 'SECURITY',
    read: true,
    createdAt: '2026-09-30T08:00:00'
  },
  {
    id: 5,
    title: 'Investment Term Deposit Confirmed',
    message: 'Your Cumulative Fixed Deposit certificate #FD2025021001 for ₹1,00,000 was opened successfully.',
    type: 'TRANSACTION',
    read: true,
    createdAt: '2026-09-20T10:30:00'
  }
];
