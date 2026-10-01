import { KycStatus, UserRole, UserStatus } from './auth.model';
import { AccountStatus } from './account.model';

export interface AuditLog {
  id: number;
  userId?: number;
  userEmail?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  description: string;
  ipAddress?: string;
  createdAt: string;
}

export interface AdminUserStatusUpdate {
  accountStatus?: UserStatus;
  kycStatus?: KycStatus;
}

export interface AdminUserRoleUpdate {
  role: UserRole;
}

export interface AdminAccountStatusUpdate {
  status: AccountStatus;
}
