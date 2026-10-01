export type NotificationType =
  | 'SECURITY'
  | 'TRANSFER'
  | 'TRANSACTION'
  | 'BILL'
  | 'LOAN'
  | 'INVESTMENT'
  | 'ACCOUNT'
  | 'SYSTEM';

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}
