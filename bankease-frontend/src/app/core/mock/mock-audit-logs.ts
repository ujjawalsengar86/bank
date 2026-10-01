import { AuditLog } from '../models/admin.model';

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 1,
    userId: 1,
    userEmail: 'customer@bankease.demo',
    action: 'TRANSFER_FUNDS',
    entityType: 'TRANSFER',
    entityId: 'TXN20260930102458',
    description: 'IMPS transfer of ₹5,000 to Rahul Sharma',
    ipAddress: '127.0.0.1',
    createdAt: '2026-09-30T09:15:20'
  },
  {
    id: 2,
    userId: 1,
    userEmail: 'customer@bankease.demo',
    action: 'BILL_PAYMENT',
    entityType: 'BILL',
    entityId: 'ELEC-BSES-10293847',
    description: 'Electricity bill settlement of ₹2,340 to BSES Rajdhani',
    ipAddress: '127.0.0.1',
    createdAt: '2026-09-25T14:30:45'
  },
  {
    id: 3,
    userId: 2,
    userEmail: 'officer@bankease.demo',
    action: 'LOAN_APPROVAL',
    entityType: 'LOAN_APPLICATION',
    entityId: '1003',
    description: 'Credit approval granted for Education Loan #1003 (₹18,00,000)',
    ipAddress: '192.168.1.45',
    createdAt: '2026-09-20T16:00:00'
  },
  {
    id: 4,
    userId: 3,
    userEmail: 'admin@bankease.demo',
    action: 'USER_ROLE_UPDATE',
    entityType: 'USER',
    entityId: '2',
    description: 'Promoted user Aditi Rao to BANK_OFFICER role',
    ipAddress: '192.168.1.1',
    createdAt: '2026-09-01T10:00:00'
  },
  {
    id: 5,
    userId: 3,
    userEmail: 'admin@bankease.demo',
    action: 'ACCOUNT_STATUS_CHANGE',
    entityType: 'ACCOUNT',
    entityId: '4',
    description: 'Placed temporary compliance freeze on account #100010007741',
    ipAddress: '192.168.1.1',
    createdAt: '2026-08-15T12:30:00'
  }
];
