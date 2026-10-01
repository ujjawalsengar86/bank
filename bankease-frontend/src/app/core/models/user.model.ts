import { KycStatus, UserRole, UserStatus } from './auth.model';

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  mobile: string;
  role: UserRole;
  kycStatus: KycStatus;
  accountStatus: UserStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface UserUpdateRequest {
  fullName: string;
  mobile: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
