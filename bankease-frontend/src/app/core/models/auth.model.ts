export type UserRole = 'CUSTOMER' | 'BANK_OFFICER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'PENDING' | 'SUSPENDED';
export type KycStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface UserSummary {
  id: number;
  fullName: string;
  email: string;
  mobile: string;
  role: UserRole;
  kycStatus: KycStatus;
  accountStatus: UserStatus;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserSummary;
}
