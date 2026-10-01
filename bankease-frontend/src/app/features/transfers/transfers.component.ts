import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TransferService } from '../../core/services/transfer.service';
import { AccountService } from '../../core/services/account.service';
import { BeneficiaryService } from '../../core/services/beneficiary.service';
import { ToastService } from '../../core/services/toast.service';
import { Account } from '../../core/models/account.model';
import { Beneficiary } from '../../core/models/beneficiary.model';
import { TransferRequest, TransferResponse } from '../../core/models/transfer.model';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr.pipe';
import { MaskAccountPipe } from '../../shared/pipes/mask-account.pipe';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-transfers',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    CurrencyInrPipe,
    MaskAccountPipe,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    ConfirmationDialogComponent
  ],
  template: `
    <div class="transfers-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Fund Transfer</h1>
          <p class="page-subtitle">Instantly transfer funds via IMPS / NEFT / RTGS with zero fees</p>
        </div>
        <div class="header-actions">
          <a routerLink="/beneficiaries" class="btn btn-secondary">
            <span class="material-symbols-outlined">person_add</span>
            Manage Beneficiaries
          </a>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-spinner *ngIf="loadingInit" message="Loading transfer configurations..."></app-loading-spinner>

      <div class="transfers-grid" *ngIf="!loadingInit">
        <!-- Transfer Form Column -->
        <div class="form-column">
          <!-- Step 1 to 3: Transfer Form (Hidden when receipt is displayed) -->
          <div class="card p-4" *ngIf="!successReceipt">
            <div class="card-header-styled">
              <span class="material-symbols-outlined icon">send_money</span>
              <div>
                <h3>Transfer Funds</h3>
                <p>Transfer to BankEase accounts or other scheduled banks</p>
              </div>
            </div>

            <form [formGroup]="transferForm" (ngSubmit)="openReviewDialog()" class="transfer-form mt-4">
              <!-- Source Account -->
              <div class="form-group">
                <label class="form-label required">From Account (Source)</label>
                <select class="form-control" formControlName="sourceAccountId">
                  <option [ngValue]="null" disabled>Select Source Account</option>
                  <option *ngFor="let acc of accounts; trackBy: trackAccount" [ngValue]="acc.id">
                    {{ acc.accountType }} ({{ acc.accountNumber | maskAccount }}) - Balance: {{ acc.balance | currencyInr }}
                  </option>
                </select>
                <div class="form-error" *ngIf="isFieldInvalid('sourceAccountId')">
                  Source account selection is required
                </div>
              </div>

              <!-- Beneficiary Selection -->
              <div class="form-group">
                <div class="flex justify-between items-center mb-1">
                  <label class="form-label required">To Beneficiary</label>
                  <a routerLink="/beneficiaries" class="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm">add</span> Add New
                  </a>
                </div>

                <div *ngIf="beneficiaries.length === 0" class="beneficiary-alert mb-2">
                  <span class="material-symbols-outlined">info</span>
                  <span>No registered beneficiaries found. <a routerLink="/beneficiaries" class="underline font-semibold">Please add a payee first</a> to initiate transfer.</span>
                </div>

                <select class="form-control" formControlName="beneficiaryId">
                  <option [ngValue]="null" disabled>Choose saved beneficiary</option>
                  <option *ngFor="let b of beneficiaries; trackBy: trackBeneficiary" [ngValue]="b.id">
                    {{ b.name }} &bull; {{ b.bankName }} ({{ b.accountNumber }})
                  </option>
                </select>
                <div class="form-error" *ngIf="isFieldInvalid('beneficiaryId')">
                  Please select a beneficiary to send funds
                </div>
              </div>

              <!-- Amount -->
              <div class="form-group">
                <label class="form-label required">Amount (INR)</label>
                <div class="input-with-prefix">
                  <span class="prefix">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    class="form-control text-lg font-bold"
                    placeholder="0.00"
                    formControlName="amount"
                  />
                </div>
                <div class="form-error" *ngIf="isFieldInvalid('amount')">
                  Enter a valid amount greater than ₹0
                </div>
                <div class="form-error" *ngIf="isAmountExceedingBalance()">
                  Transfer amount exceeds available account balance
                </div>
                <!-- Quick Amount Shortcuts -->
                <div class="amount-shortcuts mt-2">
                  <button type="button" class="btn-chip" (click)="setAmount(1000)">₹1,000</button>
                  <button type="button" class="btn-chip" (click)="setAmount(5000)">₹5,000</button>
                  <button type="button" class="btn-chip" (click)="setAmount(10000)">₹10,000</button>
                  <button type="button" class="btn-chip" (click)="setAmount(25000)">₹25,000</button>
                  <button type="button" class="btn-chip" (click)="setAmount(50000)">₹50,000</button>
                </div>
              </div>

              <!-- Description / Remarks -->
              <div class="form-group">
                <label class="form-label">Payment Description / Remarks (Optional)</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="e.g. Monthly Rent / Consultancy fee"
                  formControlName="description"
                />
              </div>

              <!-- Security Notice -->
              <div class="security-banner">
                <span class="material-symbols-outlined">security</span>
                <span>Protected by dual-authorization BankEase Core Switch. Instant ledger settlement.</span>
              </div>

              <div class="form-actions mt-4">
                <button
                  type="submit"
                  class="btn btn-primary btn-lg w-full"
                  [disabled]="transferForm.invalid || isAmountExceedingBalance() || submitting"
                >
                  <span class="material-symbols-outlined">{{ submitting ? 'hourglass_top' : 'arrow_forward' }}</span>
                  {{ submitting ? 'Processing Payment...' : 'Review & Transfer' }}
                </button>
              </div>
            </form>
          </div>

          <!-- Success State / Printable Transaction Receipt -->
          <div class="card receipt-card p-4" *ngIf="successReceipt">
            <div class="receipt-header">
              <div class="success-icon-wrap">
                <span class="material-symbols-outlined">check_circle</span>
              </div>
              <h2>Transfer Successful!</h2>
              <p>Your transaction has been processed and settled instantly.</p>
              <div class="receipt-amount">{{ successReceipt.amount | currencyInr }}</div>
            </div>

            <div class="receipt-details">
              <div class="receipt-row">
                <span class="label">Reference Number</span>
                <span class="value font-mono font-bold">{{ successReceipt.referenceNumber }}</span>
              </div>
              <div class="receipt-row">
                <span class="label">From Account</span>
                <span class="value font-mono">{{ successReceipt.sourceAccountNumber | maskAccount }}</span>
              </div>
              <div class="receipt-row">
                <span class="label">To Account</span>
                <span class="value font-mono">{{ successReceipt.beneficiaryAccountNumber }}</span>
              </div>
              <div class="receipt-row" *ngIf="successReceipt.beneficiaryName">
                <span class="label">Beneficiary Name</span>
                <span class="value font-semibold">{{ successReceipt.beneficiaryName }}</span>
              </div>
              <div class="receipt-row">
                <span class="label">Date & Time</span>
                <span class="value">{{ successReceipt.timestamp | date:'medium' }}</span>
              </div>
              <div class="receipt-row">
                <span class="label">Transaction Status</span>
                <span class="value">
                  <app-status-badge [status]="successReceipt.status"></app-status-badge>
                </span>
              </div>
              <div class="receipt-row" *ngIf="successReceipt.description">
                <span class="label">Remarks</span>
                <span class="value">{{ successReceipt.description }}</span>
              </div>
            </div>

            <div class="receipt-actions">
              <button class="btn btn-secondary" (click)="printReceipt()">
                <span class="material-symbols-outlined">print</span>
                Print Receipt
              </button>
              <button class="btn btn-primary" (click)="resetForm()">
                <span class="material-symbols-outlined">add</span>
                New Transfer
              </button>
              <a routerLink="/transactions" class="btn btn-ghost">
                View Ledger
              </a>
            </div>
          </div>
        </div>

        <!-- Recent Transfers Column (Right) -->
        <div class="history-column">
          <div class="card p-4">
            <div class="flex justify-between items-center mb-3">
              <h3 class="text-base font-bold text-dark">Recent Transfers</h3>
              <button class="btn btn-ghost btn-sm" (click)="loadTransferHistory()">
                <span class="material-symbols-outlined">refresh</span>
              </button>
            </div>

            <div *ngIf="recentTransfers.length === 0" class="text-center py-6 text-muted text-sm">
              <span class="material-symbols-outlined text-3xl mb-1 text-slate-400">history</span>
              <p>No recent transfers made from your profile.</p>
            </div>

            <div class="recent-list" *ngIf="recentTransfers.length > 0">
              <div *ngFor="let t of recentTransfers; trackBy: trackTransfer" class="recent-item">
                <div class="recent-item-icon">
                  <span class="material-symbols-outlined">north_east</span>
                </div>
                <div class="recent-item-info">
                  <span class="to-acc">{{ t.beneficiaryName }} ({{ t.beneficiaryAccountNumber | maskAccount }})</span>
                  <span class="date">{{ t.timestamp | date:'mediumDate' }} &bull; {{ t.referenceNumber }}</span>
                </div>
                <div class="recent-item-amount">
                  <span class="amount text-rose">-{{ t.amount | currencyInr }}</span>
                  <app-status-badge [status]="t.status"></app-status-badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Confirmation Review Dialog Modal -->
      <app-confirmation-dialog
        [isOpen]="showReviewDialog"
        title="Confirm Transfer Order"
        message="Please verify the transfer details below before confirming. Transferred funds are debited immediately."
        confirmLabel="Confirm & Send"
        cancelLabel="Edit Details"
        confirmButtonClass="btn-primary"
        (confirm)="executeTransfer()"
        (cancel)="showReviewDialog = false"
      >
        <div class="review-details-box mt-3" *ngIf="selectedAccountForReview">
          <div class="review-row">
            <span>Debiting Account:</span>
            <strong>{{ selectedAccountForReview.accountType }} ({{ selectedAccountForReview.accountNumber | maskAccount }})</strong>
          </div>
          <div class="review-row" *ngIf="selectedBeneficiaryForReview">
            <span>Beneficiary:</span>
            <strong class="font-mono">{{ selectedBeneficiaryForReview.name }} ({{ selectedBeneficiaryForReview.accountNumber }})</strong>
          </div>
          <div class="review-row">
            <span>Transfer Amount:</span>
            <strong class="text-emerald text-base">{{ transferForm.value.amount | currencyInr }}</strong>
          </div>
          <div class="review-row" *ngIf="transferForm.value.description">
            <span>Remarks:</span>
            <span>{{ transferForm.value.description }}</span>
          </div>
        </div>
      </app-confirmation-dialog>
    </div>
  `,
  styles: [`
    .transfers-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .page-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;

      .page-title {
        font-size: 1.6rem;
        font-weight: 700;
        color: var(--text-main);
        letter-spacing: -0.02em;
        margin: 0;
      }

      .page-subtitle {
        font-size: 0.9rem;
        color: var(--text-muted);
        margin: 4px 0 0 0;
      }
    }

    .transfers-grid {
      display: grid;
      grid-template-columns: 1.3fr 0.9fr;
      gap: 24px;
      align-items: start;
    }

    .card-header-styled {
      display: flex;
      align-items: center;
      gap: 14px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);

      .icon {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        background: #EFF6FF;
        color: #2563EB;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
      }

      h3 {
        font-size: 1.15rem;
        font-weight: 600;
        color: var(--text-main);
        margin: 0;
      }

      p {
        font-size: 0.8rem;
        color: var(--text-muted);
        margin: 2px 0 0 0;
      }
    }

    .transfer-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .input-with-prefix {
      position: relative;
      display: flex;
      align-items: center;

      .prefix {
        position: absolute;
        left: 14px;
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text-muted);
      }

      .form-control {
        padding-left: 36px;
      }
    }

    .amount-shortcuts {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;

      .btn-chip {
        background: #F1F5F9;
        border: 1px solid #E2E8F0;
        border-radius: 6px;
        padding: 4px 10px;
        font-size: 0.75rem;
        font-weight: 600;
        color: #475569;
        cursor: pointer;
        transition: all 0.15s ease;

        &:hover {
          background: #E2E8F0;
          color: #0F172A;
        }
      }
    }

    .security-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      background: #F8FAFC;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      font-size: 0.76rem;
      color: var(--text-muted);

      .material-symbols-outlined {
        color: #059669;
        font-size: 18px;
      }
    }

    .beneficiary-alert {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #EFF6FF;
      color: #1E40AF;
      padding: 10px 12px;
      border-radius: 6px;
      font-size: 0.78rem;

      .material-symbols-outlined { font-size: 18px; }
    }

    .receipt-card {
      text-align: center;
      animation: fadeIn 0.3s ease;

      .receipt-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-bottom: 20px;
        border-bottom: 1px dashed var(--border);

        .success-icon-wrap {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #ECFDF5;
          color: #059669;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;

          .material-symbols-outlined { font-size: 34px; }
        }

        h2 {
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--text-main);
          margin: 0;
        }

        p {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin: 4px 0 12px 0;
        }

        .receipt-amount {
          font-size: 2rem;
          font-weight: 800;
          color: var(--primary-accent);
          letter-spacing: -0.02em;
        }
      }

      .receipt-details {
        padding: 20px 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
        border-bottom: 1px dashed var(--border);

        .receipt-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.88rem;

          .label {
            color: var(--text-muted);
          }

          .value {
            color: var(--text-main);
          }
        }
      }

      .receipt-actions {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin-top: 20px;
        flex-wrap: wrap;
      }
    }

    .recent-list {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .recent-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px;
        border-radius: var(--radius-sm);
        border: 1px solid var(--border);
        transition: background 0.15s ease;

        &:hover {
          background: #F8FAFC;
        }

        .recent-item-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #FFF1F2;
          color: #E11D48;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .recent-item-info {
          flex: 1;
          display: flex;
          flex-direction: column;

          .to-acc {
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--text-main);
          }

          .date {
            font-size: 0.72rem;
            color: var(--text-muted);
          }
        }

        .recent-item-amount {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;

          .amount {
            font-size: 0.85rem;
            font-weight: 700;
          }
        }
      }
    }

    .review-details-box {
      background: #F8FAFC;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 0.85rem;

      .review-row {
        display: flex;
        align-items: center;
        justify-content: space-between;

        span { color: var(--text-muted); }
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 900px) {
      .transfers-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class TransfersComponent implements OnInit {
  loadingInit = true;
  submitting = false;
  showReviewDialog = false;

  accounts: Account[] = [];
  beneficiaries: Beneficiary[] = [];
  recentTransfers: TransferResponse[] = [];
  successReceipt: TransferResponse | null = null;
  selectedAccountForReview: Account | null = null;
  selectedBeneficiaryForReview: Beneficiary | null = null;

  transferForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private transferService: TransferService,
    private accountService: AccountService,
    private beneficiaryService: BeneficiaryService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  trackAccount = (_: number, acc: Account) => acc.id;
  trackBeneficiary = (_: number, b: Beneficiary) => b.id;
  trackTransfer = (_: number, t: TransferResponse) => t.referenceNumber;

  ngOnInit(): void {
    this.initForm();
    this.loadInitialData();
  }

  initForm(): void {
    this.transferForm = this.fb.group({
      sourceAccountId: [null, [Validators.required]],
      beneficiaryId: [null, [Validators.required]],
      amount: [null, [Validators.required, Validators.min(1)]],
      description: ['']
    });
  }

  loadInitialData(): void {
    this.loadingInit = true;

    forkJoin({
      accounts: this.accountService.getAccounts(),
      beneficiaries: this.beneficiaryService.getBeneficiaries(),
      transfers: this.transferService.getTransfers()
    }).subscribe({
      next: (res) => {
        this.accounts = res.accounts || [];
        this.beneficiaries = res.beneficiaries || [];
        this.recentTransfers = res.transfers || [];
        this.loadingInit = false;

        // Auto select source account if requested via queryParam
        this.route.queryParams.subscribe(params => {
          const reqAccId = params['fromAccountId'] ? Number(params['fromAccountId']) : null;
          if (reqAccId) {
            const acc = this.accounts.find(a => a.id === reqAccId);
            if (acc) {
              this.transferForm.patchValue({ sourceAccountId: acc.id });
              return;
            }
          }
          if (this.accounts.length > 0 && !this.transferForm.value.sourceAccountId) {
            this.transferForm.patchValue({ sourceAccountId: this.accounts[0].id });
          }
        });

        if (this.beneficiaries.length > 0 && !this.transferForm.value.beneficiaryId) {
          this.transferForm.patchValue({ beneficiaryId: this.beneficiaries[0].id });
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingInit = false;
        this.cdr.markForCheck();
        this.toastService.error('Failed to load accounts and transfer configurations.');
      }
    });
  }

  loadTransferHistory(): void {
    this.transferService.getTransfers().subscribe({
      next: (data) => {
        this.recentTransfers = data || [];
        this.cdr.markForCheck();
        this.toastService.info('Transfer history updated.');
      },
      error: () => {
        this.cdr.markForCheck();
      }
    });
  }

  setAmount(val: number): void {
    this.transferForm.patchValue({ amount: val });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.transferForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  isAmountExceedingBalance(): boolean {
    const accId = this.transferForm.value.sourceAccountId;
    const amount = Number(this.transferForm.value.amount);
    if (!accId || !amount) return false;

    const acc = this.accounts.find(a => a.id === accId);
    if (!acc) return false;

    return amount > acc.balance;
  }

  openReviewDialog(): void {
    if (this.transferForm.invalid || this.isAmountExceedingBalance()) return;
    const accId = this.transferForm.value.sourceAccountId;
    const benId = this.transferForm.value.beneficiaryId;
    this.selectedAccountForReview = this.accounts.find(a => a.id === accId) || null;
    this.selectedBeneficiaryForReview = this.beneficiaries.find(b => b.id === benId) || null;
    this.showReviewDialog = true;
    this.cdr.markForCheck();
  }

  executeTransfer(): void {
    this.showReviewDialog = false;
    this.submitting = true;
    this.cdr.markForCheck();

    const req: TransferRequest = {
      sourceAccountId: this.transferForm.value.sourceAccountId,
      beneficiaryId: this.transferForm.value.beneficiaryId,
      amount: Number(this.transferForm.value.amount),
      description: this.transferForm.value.description ? this.transferForm.value.description.trim() : undefined
    };

    this.transferService.transferFunds(req).subscribe({
      next: (receipt) => {
        this.submitting = false;
        this.successReceipt = receipt;
        this.toastService.success('Transfer executed successfully!');
        // Refresh account balance and transfers
        this.accountService.getAccounts().subscribe(accs => {
          this.accounts = accs || [];
          this.cdr.markForCheck();
        });
        this.loadTransferHistory();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.submitting = false;
        const msg = err?.error?.message || 'Transfer failed. Please check destination details and balance.';
        this.toastService.error(msg);
        this.cdr.markForCheck();
      }
    });
  }

  resetForm(): void {
    this.successReceipt = null;
    this.transferForm.reset({
      sourceAccountId: this.accounts.length > 0 ? this.accounts[0].id : null,
      beneficiaryId: this.beneficiaries.length > 0 ? this.beneficiaries[0].id : null,
      amount: null,
      description: ''
    });
    this.cdr.markForCheck();
  }

  printReceipt(): void {
    window.print();
  }
}
