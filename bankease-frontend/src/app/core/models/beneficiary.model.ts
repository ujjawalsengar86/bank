export type BeneficiaryStatus = 'ACTIVE' | 'INACTIVE';

export interface Beneficiary {
  id: number;
  userId?: number;
  name: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  status: BeneficiaryStatus;
  createdAt: string;
}

export interface BeneficiaryRequest {
  name: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
}
