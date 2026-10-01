import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { BillService } from '../../core/services/bill.service';
import { AccountService } from '../../core/services/account.service';
import { ToastService } from '../../core/services/toast.service';
import { Account } from '../../core/models/account.model';
import { Bill, Biller, BillFetchRequest, BillPayRequest, BillPaymentResponse } from '../../core/models/bill.model';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr.pipe';
import { MaskAccountPipe } from '../../shared/pipes/mask-account.pipe';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-bills',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CurrencyInrPipe,
    MaskAccountPipe,
    StatusBadgeComponent,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="bills-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Bill Payments & Utilities</h1>
          <p class="page-subtitle">Instant BBPS-enabled bill fetching and settlement across utility providers</p>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-spinner *ngIf="loadingInit" message="Loading billers and accounts..."></app-loading-spinner>

      <div class="bills-layout" *ngIf="!loadingInit">
        <!-- Left: Fetch & Pay Form -->
        <div class="left-col">
          <!-- Step 1: Select Category Filter & Biller -->
          <div class="card p-4" *ngIf="!paymentReceipt">
            <h3 class="card-title mb-3">1. Select Utility Provider</h3>

            <!-- Category Pills -->
            <div class="category-pills mb-3">
              <button
                type="button"
                class="cat-pill"
                [class.active]="selectedCategory === 'ALL'"
                (click)="setCategory('ALL')"
              >
                All Providers
              </button>
              <button
                type="button"
                class="cat-pill"
                [class.active]="selectedCategory === 'ELECTRICITY'"
                (click)="setCategory('ELECTRICITY')"
              >
                <span class="material-symbols-outlined icon">bolt</span>
                Electricity
              </button>
              <button
                type="button"
                class="cat-pill"
                [class.active]="selectedCategory === 'WATER'"
                (click)="setCategory('WATER')"
              >
                <span class="material-symbols-outlined icon">water_drop</span>
                Water
              </button>
              <button
                type="button"
                class="cat-pill"
                [class.active]="selectedCategory === 'INTERNET'"
                (click)="setCategory('INTERNET')"
              >
                <span class="material-symbols-outlined icon">wifi</span>
                Broadband
              </button>
              <button
                type="button"
                class="cat-pill"
                [class.active]="selectedCategory === 'MOBILE'"
                (click)="setCategory('MOBILE')"
              >
                <span class="material-symbols-outlined icon">smartphone</span>
                Mobile Recharge
              </button>
              <button
                type="button"
                class="cat-pill"
                [class.active]="selectedCategory === 'GAS'"
                (click)="setCategory('GAS')"
              >
                <span class="material-symbols-outlined icon">local_fire_department</span>
                Gas Piped
              </button>
            </div>

            <!-- Fetch Form -->
            <form [formGroup]="fetchForm" (ngSubmit)="fetchBill()">
              <div class="form-group mb-3">
                <label class="form-label required">Biller / Service Provider</label>
                <select class="form-control" formControlName="billerId">
                  <option [ngValue]="null" disabled>Select Biller</option>
                  <option *ngFor="let b of filteredBillers" [ngValue]="b.id">
                    {{ b.name }} ({{ b.category }})
                  </option>
                </select>
              </div>

              <div class="form-group mb-3">
                <label class="form-label required">Consumer / Account ID</label>
                <input
                  type="text"
                  class="form-control font-mono"
                  placeholder="e.g. ELEC-100234 or MOB-9876543210"
                  formControlName="consumerNumber"
                />
              </div>

              <button
                type="submit"
                class="btn btn-secondary w-full"
                [disabled]="fetchForm.invalid || fetchingBill"
              >
                <span class="material-symbols-outlined">{{ fetchingBill ? 'hourglass_top' : 'search' }}</span>
                {{ fetchingBill ? 'Fetching Bill from Operator...' : 'Fetch Bill Details' }}
              </button>
            </form>

            <!-- Fetched Bill Preview & Payment Form -->
            <div *ngIf="fetchedBill" class="fetched-bill-card mt-4">
              <div class="bill-header">
                <div>
                  <span class="badge badge-subtle mb-1">Bill Found</span>
                  <h4>{{ fetchedBill.billerName }}</h4>
                  <span class="consumer-id">Consumer: {{ fetchedBill.consumerNumber }}</span>
                </div>
                <div class="bill-amount text-right">
                  <span class="label">Amount Due</span>
                  <span class="amount">{{ fetchedBill.amount | currencyInr }}</span>
                </div>
              </div>

              <div class="bill-meta">
                <div class="meta-item">
                  <span class="label">Bill Date</span>
                  <span class="val">{{ fetchedBill.billDate | date:'mediumDate' }}</span>
                </div>
                <div class="meta-item">
                  <span class="label">Due Date</span>
                  <span class="val font-semibold text-rose">{{ fetchedBill.dueDate | date:'mediumDate' }}</span>
                </div>
                <div class="meta-item">
                  <span class="label">Bill Status</span>
                  <span class="val">
                    <app-status-badge [status]="fetchedBill.status"></app-status-badge>
                  </span>
                </div>
              </div>

              <!-- Payment Form -->
              <div class="mt-4 pt-3 border-t border-slate-200">
                <div class="form-group mb-3">
                  <label class="form-label required">Pay From Bank Account</label>
                  <select class="form-control" [(ngModel)]="selectedPayAccountId">
                    <option [ngValue]="null" disabled>Select Account</option>
                    <option *ngFor="let acc of accounts" [ngValue]="acc.id">
                      {{ acc.accountType }} ({{ acc.accountNumber | maskAccount }}) - Balance: {{ acc.balance | currencyInr }}
                    </option>
                  </select>
                </div>

                <button
                  type="button"
                  class="btn btn-primary btn-lg w-full"
                  (click)="payBill()"
                  [disabled]="!selectedPayAccountId || payingBill || fetchedBill.status === 'PAID'"
                >
                  <span class="material-symbols-outlined">{{ payingBill ? 'hourglass_top' : 'check_circle' }}</span>
                  {{ payingBill ? 'Processing Payment...' : ('Pay ' + (fetchedBill.amount | currencyInr)) }}
                </button>
              </div>
            </div>
          </div>

          <!-- Successful Bill Payment Receipt -->
          <div class="card p-4 receipt-card" *ngIf="paymentReceipt">
            <div class="receipt-header">
              <div class="success-icon-wrap">
                <span class="material-symbols-outlined">receipt_long</span>
              </div>
              <h2>Bill Payment Successful!</h2>
              <p>Operator acknowledgment received. Reference saved to your ledger.</p>
              <div class="receipt-amount">{{ paymentReceipt.amount | currencyInr }}</div>
            </div>

            <div class="receipt-details">
              <div class="receipt-row">
                <span class="label">Reference / Receipt</span>
                <span class="val font-mono font-bold">{{ paymentReceipt.receiptNumber }}</span>
              </div>
              <div class="receipt-row">
                <span class="label">Biller Name</span>
                <span class="val font-semibold">{{ paymentReceipt.billerName }}</span>
              </div>
              <div class="receipt-row">
                <span class="label">Consumer Number</span>
                <span class="val font-mono">{{ paymentReceipt.consumerNumber }}</span>
              </div>
              <div class="receipt-row">
                <span class="label">Paid From Account</span>
                <span class="val font-mono">{{ (paymentReceipt.sourceAccountNumber || '') | maskAccount }}</span>
              </div>
              <div class="receipt-row">
                <span class="label">Payment Date</span>
                <span class="val">{{ paymentReceipt.paymentDate | date:'medium' }}</span>
              </div>
              <div class="receipt-row">
                <span class="label">Status</span>
                <span class="val">
                  <app-status-badge [status]="paymentReceipt.status"></app-status-badge>
                </span>
              </div>
            </div>

            <div class="receipt-actions">
              <button class="btn btn-secondary" (click)="printReceipt()">
                <span class="material-symbols-outlined">print</span>
                Print Receipt
              </button>
              <button class="btn btn-primary" (click)="resetBillState()">
                Pay Another Bill
              </button>
            </div>
          </div>
        </div>

        <!-- Right: Payment History -->
        <div class="right-col">
          <div class="card p-4">
            <div class="flex justify-between items-center mb-3">
              <h3 class="card-title">Bill Payment History</h3>
              <button class="btn btn-ghost btn-sm" (click)="loadBillHistory()">
                <span class="material-symbols-outlined">refresh</span>
              </button>
            </div>

            <div *ngIf="billHistory.length === 0" class="text-center py-8 text-muted text-sm">
              <span class="material-symbols-outlined text-3xl mb-1 text-slate-400">receipt</span>
              <p>No past bill payments recorded.</p>
            </div>

            <div class="history-list" *ngIf="billHistory.length > 0">
              <div *ngFor="let item of billHistory" class="history-item">
                <div class="item-icon">
                  <span class="material-symbols-outlined">bolt</span>
                </div>
                <div class="item-info">
                  <span class="biller">{{ item.billerName }}</span>
                  <span class="meta font-mono">{{ item.consumerNumber }} &bull; {{ item.paymentDate | date:'mediumDate' }}</span>
                </div>
                <div class="item-amount">
                  <span class="amount">{{ item.amount | currencyInr }}</span>
                  <app-status-badge [status]="item.status"></app-status-badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bills-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .page-header {
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

    .bills-layout {
      display: grid;
      grid-template-columns: 1.2fr 0.9fr;
      gap: 24px;
      align-items: start;
    }

    .card-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-main);
      margin: 0;
    }

    .category-pills {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;

      .cat-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #F1F5F9;
        border: 1px solid #E2E8F0;
        border-radius: 9999px;
        padding: 6px 12px;
        font-size: 0.78rem;
        font-weight: 600;
        color: #475569;
        cursor: pointer;
        transition: all 0.15s ease;

        .icon { font-size: 16px; }

        &:hover {
          background: #E2E8F0;
          color: #0F172A;
        }

        &.active {
          background: var(--primary);
          color: #FFFFFF;
          border-color: var(--primary);
        }
      }
    }

    .fetched-bill-card {
      background: #F8FAFC;
      border: 1px solid #CBD5E1;
      border-radius: var(--radius-md);
      padding: 16px;

      .bill-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding-bottom: 12px;
        border-bottom: 1px solid #E2E8F0;

        h4 {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-main);
          margin: 0;
        }

        .consumer-id {
          font-size: 0.8rem;
          font-family: monospace;
          color: var(--text-muted);
        }

        .bill-amount {
          display: flex;
          flex-direction: column;
          align-items: flex-end;

          .label { font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); }
          .amount { font-size: 1.45rem; font-weight: 800; color: var(--primary-accent); }
        }
      }

      .bill-meta {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        padding: 12px 0 0 0;

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
          .label { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; }
          .val { font-size: 0.85rem; color: var(--text-main); }
        }
      }
    }

    .receipt-card {
      text-align: center;

      .receipt-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-bottom: 18px;
        border-bottom: 1px dashed var(--border);

        .success-icon-wrap {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: #ECFDF5;
          color: #059669;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
          .material-symbols-outlined { font-size: 30px; }
        }

        h2 { font-size: 1.3rem; font-weight: 700; margin: 0; }
        p { font-size: 0.85rem; color: var(--text-muted); margin: 4px 0 10px 0; }
        .receipt-amount { font-size: 1.8rem; font-weight: 800; color: var(--primary-accent); }
      }

      .receipt-details {
        padding: 18px 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
        border-bottom: 1px dashed var(--border);

        .receipt-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          .label { color: var(--text-muted); }
          .val { color: var(--text-main); }
        }
      }

      .receipt-actions {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-top: 18px;
      }
    }

    .history-list {
      display: flex;
      flex-direction: column;
      gap: 10px;

      .history-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px;
        border-radius: var(--radius-sm);
        border: 1px solid var(--border);

        .item-icon {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: #FFFBEB;
          color: #D97706;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .item-info {
          flex: 1;
          display: flex;
          flex-direction: column;

          .biller { font-size: 0.88rem; font-weight: 600; color: var(--text-main); }
          .meta { font-size: 0.72rem; color: var(--text-muted); }
        }

        .item-amount {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          .amount { font-size: 0.88rem; font-weight: 700; }
        }
      }
    }

    .badge-subtle {
      display: inline-block;
      background: #ECFDF5;
      color: #059669;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
    }

    @media (max-width: 900px) {
      .bills-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class BillsComponent implements OnInit {
  loadingInit = true;
  fetchingBill = false;
  payingBill = false;

  accounts: Account[] = [];
  allBillers: Biller[] = [];
  filteredBillers: Biller[] = [];
  billHistory: BillPaymentResponse[] = [];

  selectedCategory = 'ALL';
  selectedPayAccountId: number | null = null;
  fetchedBill: Bill | null = null;
  paymentReceipt: BillPaymentResponse | null = null;

  fetchForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private billService: BillService,
    private accountService: AccountService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.fetchForm = this.fb.group({
      billerId: [null, [Validators.required]],
      consumerNumber: ['', [Validators.required, Validators.minLength(4)]]
    });

    this.loadInitialData();
  }

  loadInitialData(): void {
    this.loadingInit = true;

    forkJoin({
      accounts: this.accountService.getAccounts(),
      billers: this.billService.getBillers(),
      history: this.billService.getBillHistory()
    }).subscribe({
      next: (res) => {
        this.accounts = res.accounts || [];
        this.allBillers = res.billers || [];
        this.filteredBillers = [...this.allBillers];
        this.billHistory = res.history || [];
        if (this.accounts.length > 0) {
          this.selectedPayAccountId = this.accounts[0].id;
        }
        this.loadingInit = false;
      },
      error: () => {
        this.loadingInit = false;
        this.toastService.error('Failed to load bill payment resources.');
      }
    });
  }

  setCategory(cat: string): void {
    this.selectedCategory = cat;
    if (cat === 'ALL') {
      this.filteredBillers = [...this.allBillers];
    } else {
      this.filteredBillers = this.allBillers.filter(b => b.category.toUpperCase() === cat);
    }
    this.fetchForm.patchValue({ billerId: null });
  }

  fetchBill(): void {
    if (this.fetchForm.invalid) return;
    this.fetchingBill = true;
    this.fetchedBill = null;

    const req: BillFetchRequest = {
      billerId: this.fetchForm.value.billerId,
      consumerNumber: this.fetchForm.value.consumerNumber.trim()
    };

    this.billService.fetchBill(req).subscribe({
      next: (bill) => {
        this.fetchingBill = false;
        this.fetchedBill = bill;
        this.toastService.success('Bill fetched successfully from provider!');
      },
      error: (err) => {
        this.fetchingBill = false;
        this.toastService.error(err?.error?.message || 'Bill not found for the given consumer ID.');
      }
    });
  }

  payBill(): void {
    if (!this.fetchedBill || !this.selectedPayAccountId) return;
    this.payingBill = true;

    const payReq: BillPayRequest = {
      sourceAccountId: this.selectedPayAccountId,
      billId: this.fetchedBill.id,
      amount: this.fetchedBill.amount
    };

    this.billService.payBill(payReq).subscribe({
      next: (receipt) => {
        this.payingBill = false;
        this.paymentReceipt = receipt;
        this.toastService.success('Bill paid successfully!');
        this.loadBillHistory();
        // Refresh accounts balance
        this.accountService.getAccounts().subscribe(accs => this.accounts = accs || []);
      },
      error: (err) => {
        this.payingBill = false;
        this.toastService.error(err?.error?.message || 'Bill payment failed. Please check your account balance.');
      }
    });
  }

  loadBillHistory(): void {
    this.billService.getBillHistory().subscribe({
      next: (data) => {
        this.billHistory = data || [];
      }
    });
  }

  resetBillState(): void {
    this.paymentReceipt = null;
    this.fetchedBill = null;
    this.fetchForm.reset();
  }

  printReceipt(): void {
    window.print();
  }
}
