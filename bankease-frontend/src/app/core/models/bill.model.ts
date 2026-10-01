export type BillerCategory = 'ELECTRICITY' | 'WATER' | 'MOBILE' | 'INTERNET';
export type BillStatus = 'UNPAID' | 'PAID' | 'OVERDUE';

export interface Biller {
  id: number;
  name: string;
  category: BillerCategory;
  billerCode: string;
  description: string;
  active: boolean;
}

export interface Bill {
  id: number;
  billerId: number;
  billerName: string;
  billerCategory: BillerCategory;
  consumerNumber: string;
  consumerName?: string;
  amount: number;
  billDate: string;
  dueDate: string;
  status: BillStatus;
}

export interface BillFetchRequest {
  billerId: number;
  consumerNumber: string;
}

export interface BillPayRequest {
  billId?: number;
  billerId?: number;
  consumerNumber?: string;
  sourceAccountId: number;
  amount: number;
}

export interface BillPaymentResponse {
  receiptNumber: string;
  billId?: number;
  billerName?: string;
  consumerNumber?: string;
  amount: number;
  paymentDate: string;
  sourceAccountNumber?: string;
  transactionReference?: string;
  status: string;
}
