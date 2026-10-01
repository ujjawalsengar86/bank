export interface TransferRequest {
  sourceAccountId: number;
  beneficiaryId: number;
  amount: number;
  description?: string;
}

export interface TransferResponse {
  referenceNumber: string;
  sourceAccountId: number;
  sourceAccountNumber: string;
  beneficiaryName: string;
  beneficiaryAccountNumber: string;
  amount: number;
  status: string;
  description?: string;
  timestamp: string;
}
