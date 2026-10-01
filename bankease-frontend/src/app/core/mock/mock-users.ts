import { UserProfile } from '../models/user.model';
import { AuthResponse } from '../models/auth.model';

export interface DemoAccountCreds {
  email: string;
  password: string;
  role: 'CUSTOMER' | 'BANK_OFFICER' | 'ADMIN';
  fullName: string;
  mobile: string;
}

export const MOCK_USERS: DemoAccountCreds[] = [
  {
    email: 'customer@bankease.demo',
    password: 'Customer@123',
    role: 'CUSTOMER',
    fullName: 'Ujjawal',
    mobile: '+91 98765 43210'
  },
  {
    email: 'officer@bankease.demo',
    password: 'Officer@123',
    role: 'BANK_OFFICER',
    fullName: 'Aditi Rao (Loan Officer)',
    mobile: '+91 98111 22334'
  },
  {
    email: 'admin@bankease.demo',
    password: 'Admin@123',
    role: 'ADMIN',
    fullName: 'Vikram Malhotra (Super Admin)',
    mobile: '+91 99000 11223'
  }
];

export const MOCK_USER_PROFILES: UserProfile[] = [
  {
    id: 1,
    fullName: 'Ujjawal',
    email: 'customer@bankease.demo',
    mobile: '+91 98765 43210',
    role: 'CUSTOMER',
    kycStatus: 'VERIFIED',
    accountStatus: 'ACTIVE',
    createdAt: '2025-01-15T09:30:00'
  },
  {
    id: 2,
    fullName: 'Aditi Rao',
    email: 'officer@bankease.demo',
    mobile: '+91 98111 22334',
    role: 'BANK_OFFICER',
    kycStatus: 'VERIFIED',
    accountStatus: 'ACTIVE',
    createdAt: '2024-06-10T11:00:00'
  },
  {
    id: 3,
    fullName: 'Vikram Malhotra',
    email: 'admin@bankease.demo',
    mobile: '+91 99000 11223',
    role: 'ADMIN',
    kycStatus: 'VERIFIED',
    accountStatus: 'ACTIVE',
    createdAt: '2024-01-01T08:00:00'
  },
  {
    id: 4,
    fullName: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    mobile: '+91 98222 33445',
    role: 'CUSTOMER',
    kycStatus: 'VERIFIED',
    accountStatus: 'ACTIVE',
    createdAt: '2025-03-20T14:15:00'
  },
  {
    id: 5,
    fullName: 'Priya Singh',
    email: 'priya.singh@example.com',
    mobile: '+91 97333 44556',
    role: 'CUSTOMER',
    kycStatus: 'PENDING',
    accountStatus: 'SUSPENDED',
    createdAt: '2025-07-08T16:45:00'
  }
];

export function createMockAuthResponse(user: DemoAccountCreds): AuthResponse {
  return {
    accessToken: `mock-jwt-token-${user.role.toLowerCase()}-${Date.now()}`,
    tokenType: 'Bearer',
    expiresIn: 86400,
    user: {
      id: user.role === 'CUSTOMER' ? 1 : user.role === 'BANK_OFFICER' ? 2 : 3,
      fullName: user.fullName,
      email: user.email,
      mobile: '+91 98765 43210',
      role: user.role,
      kycStatus: 'VERIFIED',
      accountStatus: 'ACTIVE'
    }
  };
}
