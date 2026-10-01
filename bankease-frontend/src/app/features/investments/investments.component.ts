import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { InvestmentService } from '../../core/services/investment.service';
import { AccountService } from '../../core/services/account.service';
import { ToastService } from '../../core/services/toast.service';
import { Account } from '../../core/models/account.model';
import {
  Investment,
  InvestmentCreateRequest,
  InvestmentProduct,
  PortfolioSummary,
  WithdrawRequest
} from '../../core/models/investment.model';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr.pipe';
import { MaskAccountPipe } from '../../shared/pipes/mask-account.pipe';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-investments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CurrencyInrPipe,
    MaskAccountPipe,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="investments-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Wealth & Investments</h1>
          <p class="page-subtitle">Grow your savings with guaranteed Fixed Deposits, Recurring Deposits, and curated funds</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" (click)="openCreateModal()">
            <span class="material-symbols-outlined">add_circle</span>
            New Investment
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-spinner *ngIf="loadingInit" message="Loading investment portfolio..."></app-loading-spinner>

      <ng-container *ngIf="!loadingInit">
        <!-- Portfolio Summary Row -->
        <div class="grid grid-cols-4 gap-4 mb-4">
          <div class="stat-card">
            <span class="label">Total Invested</span>
            <span class="val">{{ (portfolio?.totalInvested || 0) | currencyInr }}</span>
            <span class="meta text-muted">Original principal</span>
          </div>
          <div class="stat-card">
            <span class="label">Current Valuation</span>
            <span class="val text-emerald">{{ (portfolio?.currentValue || 0) | currencyInr }}</span>
            <span class="meta text-muted">Accrued as of today</span>
          </div>
          <div class="stat-card">
            <span class="label">Total Return</span>
            <span class="val" [class.text-emerald]="(portfolio?.totalReturns || 0) >= 0" [class.text-rose]="(portfolio?.totalReturns || 0) < 0">
              {{ (portfolio?.totalReturns || 0) | currencyInr }}
            </span>
            <span class="meta" [class.positive]="(portfolio?.totalReturns || 0) >= 0">
              <span class="material-symbols-outlined text-xs">trending_up</span>
              Guaranteed growth
            </span>
          </div>
          <div class="stat-card">
            <span class="label">Active Holdings</span>
            <span class="val">{{ investments.length }}</span>
            <span class="meta text-muted">Deposits & Instruments</span>
          </div>
        </div>

        <!-- Available Products Showcase -->
        <div class="section-card mb-4">
          <div class="section-header">
            <div>
              <h3 class="section-title">Explore Investment Products</h3>
              <p class="section-desc">Highest industry return rates with sovereign assurance</p>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-4 p-4">
            <div *ngFor="let p of products" class="product-card">
              <div class="prod-top">
                <span class="badge badge-subtle">{{ p.investmentType }}</span>
                <span class="interest-rate">{{ p.interestRate }}% p.a.</span>
              </div>
              <h4>{{ p.name }}</h4>
              <p class="desc">{{ p.description }}</p>
              <div class="prod-limits">
                <span>Min: {{ p.minAmount | currencyInr }}</span>
                <span>Tenure: from {{ p.minTenureMonths }} Mo.</span>
              </div>
              <button class="btn btn-secondary btn-sm mt-3 w-full" (click)="openCreateModal(p)">
                Invest Now
              </button>
            </div>
          </div>
        </div>

        <!-- My Active Holdings Table -->
        <div class="section-card">
          <div class="section-header">
            <div>
              <h3 class="section-title">My Investment Portfolio</h3>
              <p class="section-desc">All active and matured term deposits</p>
            </div>
          </div>

          <div *ngIf="investments.length === 0" class="p-4">
            <app-empty-state
              icon="savings"
              title="No Active Investments"
              description="Start your wealth building journey by opening a high-yield Fixed or Recurring Deposit."
              actionLabel="Open Term Deposit"
              (action)="openCreateModal()"
            ></app-empty-state>
          </div>

          <div class="table-container" *ngIf="investments.length > 0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Ref ID</th>
                  <th>Product</th>
                  <th>Invested Amount</th>
                  <th>Interest Rate</th>
                  <th>Start Date</th>
                  <th>Maturity Date</th>
                  <th>Expected Maturity Value</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let inv of investments">
                  <td class="font-mono text-xs">#{{ inv.id }}</td>
                  <td class="font-semibold">{{ inv.investmentProductName }}</td>
                  <td class="font-bold">{{ inv.investedAmount | currencyInr }}</td>
                  <td>{{ inv.interestRate }}% p.a.</td>
                  <td class="text-xs">{{ inv.startDate | date:'mediumDate' }}</td>
                  <td class="text-xs font-semibold">{{ inv.maturityDate | date:'mediumDate' }}</td>
                  <td class="font-bold text-emerald">{{ inv.expectedMaturityAmount | currencyInr }}</td>
                  <td><app-status-badge [status]="inv.status"></app-status-badge></td>
                  <td>
                    <button
                      *ngIf="inv.status === 'ACTIVE'"
                      class="btn btn-secondary btn-sm"
                      (click)="openWithdrawModal(inv)"
                    >
                      Withdraw
                    </button>
                    <span *ngIf="inv.status !== 'ACTIVE'" class="text-xs text-muted">Settled</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ng-container>

      <!-- Open New Investment Modal -->
      <div class="modal-overlay" *ngIf="showCreateModal" (click)="showCreateModal = false">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Open New Investment</h3>
            <button class="btn-close" (click)="showCreateModal = false">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <form [formGroup]="investForm" (ngSubmit)="submitInvestment()">
            <div class="modal-body">
              <div class="form-group mb-3">
                <label class="form-label required">Select Investment Scheme</label>
                <select class="form-control" formControlName="investmentProductId" (change)="onProductChange()">
                  <option [ngValue]="null" disabled>Choose product</option>
                  <option *ngFor="let p of products" [ngValue]="p.id">
                    {{ p.name }} - {{ p.interestRate }}% p.a. (Min {{ p.minAmount | currencyInr }})
                  </option>
                </select>
              </div>

              <div class="form-group mb-3">
                <label class="form-label required">Funding Bank Account</label>
                <select class="form-control" formControlName="accountId">
                  <option [ngValue]="null" disabled>Choose Account to debit</option>
                  <option *ngFor="let acc of accounts" [ngValue]="acc.id">
                    {{ acc.accountType }} ({{ acc.accountNumber | maskAccount }}) - Balance: {{ acc.balance | currencyInr }}
                  </option>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-3 mb-3">
                <div class="form-group">
                  <label class="form-label required">Investment Amount (INR)</label>
                  <input
                    type="number"
                    step="500"
                    class="form-control font-bold"
                    placeholder="e.g. 50000"
                    formControlName="amount"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label required">Tenure (Months)</label>
                  <input
                    type="number"
                    step="6"
                    class="form-control"
                    placeholder="e.g. 12"
                    formControlName="tenureMonths"
                  />
                </div>
              </div>

              <div class="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-muted">
                Interest is compounded quarterly and paid upon maturity or credited according to instrument terms.
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showCreateModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="investForm.invalid || creating">
                {{ creating ? 'Submitting Order...' : 'Confirm & Invest' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Withdraw Modal -->
      <div class="modal-overlay" *ngIf="withdrawingInv" (click)="withdrawingInv = null">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Premature Closure / Withdrawal</h3>
            <button class="btn-close" (click)="withdrawingInv = null">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="modal-body">
            <p class="text-sm text-muted mb-3">
              Closing investment #{{ withdrawingInv.id }} early will credit proceeds to your selected account.
            </p>

            <div class="form-group mb-3">
              <label class="form-label required">Credit Proceeds to Account</label>
              <select class="form-control" [(ngModel)]="withdrawAccountId">
                <option [ngValue]="null" disabled>Choose destination account</option>
                <option *ngFor="let acc of accounts" [ngValue]="acc.id">
                  {{ acc.accountType }} ({{ acc.accountNumber | maskAccount }})
                </option>
              </select>
            </div>

            <div class="form-group mb-3">
              <label class="form-label required">Reason for Withdrawal</label>
              <input
                type="text"
                class="form-control"
                placeholder="e.g. Personal emergency"
                [(ngModel)]="withdrawReason"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="withdrawingInv = null">Cancel</button>
            <button
              class="btn btn-danger"
              (click)="executeWithdraw()"
              [disabled]="!withdrawAccountId || !withdrawReason.trim() || withdrawing"
            >
              {{ withdrawing ? 'Processing Closure...' : 'Confirm Withdrawal' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .investments-page {
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

    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 4px;

      .label { font-size: 0.75rem; text-transform: uppercase; font-weight: 600; color: var(--text-muted); }
      .val { font-size: 1.4rem; font-weight: 800; color: var(--text-main); letter-spacing: -0.02em; }
      .meta { font-size: 0.75rem; display: flex; align-items: center; gap: 4px; }
      .positive { color: #059669; font-weight: 600; }
    }

    .section-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
      overflow: hidden;

      .section-header {
        padding: 18px 24px;
        border-bottom: 1px solid var(--border);
        .section-title { font-size: 1.15rem; font-weight: 600; margin: 0; }
        .section-desc { font-size: 0.82rem; color: var(--text-muted); margin: 2px 0 0 0; }
      }
    }

    .product-card {
      background: #F8FAFC;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 18px;
      display: flex;
      flex-direction: column;

      .prod-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .interest-rate {
          font-size: 0.95rem;
          font-weight: 800;
          color: #059669;
        }
      }

      h4 { margin: 0; font-size: 1rem; font-weight: 700; color: var(--text-main); }
      .desc { font-size: 0.8rem; color: var(--text-muted); margin: 4px 0 12px 0; min-height: 38px; }

      .prod-limits {
        display: flex;
        justify-content: space-between;
        font-size: 0.74rem;
        color: #475569;
        border-top: 1px dashed var(--border);
        padding-top: 8px;
        margin-top: auto;
      }
    }

    .badge-subtle {
      background: #EEF2FF;
      color: #4F46E5;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .table-container { overflow-x: auto; }

    @media (max-width: 1024px) {
      .grid-cols-4 { grid-template-columns: repeat(2, 1fr); }
      .grid-cols-3 { grid-template-columns: 1fr; }
    }

    @media (max-width: 640px) {
      .grid-cols-4 { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class InvestmentsComponent implements OnInit {
  loadingInit = true;
  creating = false;
  withdrawing = false;
  showCreateModal = false;

  accounts: Account[] = [];
  products: InvestmentProduct[] = [];
  investments: Investment[] = [];
  portfolio: PortfolioSummary | null = null;

  investForm!: FormGroup;

  // Withdraw
  withdrawingInv: Investment | null = null;
  withdrawAccountId: number | null = null;
  withdrawReason = '';

  constructor(
    private investmentService: InvestmentService,
    private accountService: AccountService,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.investForm = this.fb.group({
      investmentProductId: [null, [Validators.required]],
      accountId: [null, [Validators.required]],
      amount: [25000, [Validators.required, Validators.min(1000)]],
      tenureMonths: [12, [Validators.required, Validators.min(3)]]
    });

    this.loadInitialData();
  }

  loadInitialData(): void {
    this.loadingInit = true;

    forkJoin({
      accounts: this.accountService.getAccounts(),
      products: this.investmentService.getProducts(),
      investments: this.investmentService.getMyInvestments(),
      portfolio: this.investmentService.getPortfolio()
    }).subscribe({
      next: (res) => {
        this.accounts = res.accounts || [];
        this.products = res.products || [];
        this.investments = res.investments || [];
        this.portfolio = res.portfolio || null;
        if (this.accounts.length > 0) {
          this.investForm.patchValue({ accountId: this.accounts[0].id });
        }
        if (this.products.length > 0) {
          this.investForm.patchValue({ investmentProductId: this.products[0].id });
        }
        this.loadingInit = false;
      },
      error: () => {
        this.loadingInit = false;
        this.toastService.error('Failed to load investment services.');
      }
    });
  }

  openCreateModal(p?: InvestmentProduct): void {
    if (p) {
      this.investForm.patchValue({
        investmentProductId: p.id,
        amount: p.minAmount,
        tenureMonths: p.minTenureMonths
      });
    }
    this.showCreateModal = true;
  }

  onProductChange(): void {
    const prodId = this.investForm.value.investmentProductId;
    const prod = this.products.find(p => p.id === prodId);
    if (prod) {
      this.investForm.patchValue({
        amount: prod.minAmount,
        tenureMonths: prod.minTenureMonths
      });
    }
  }

  submitInvestment(): void {
    if (this.investForm.invalid) return;
    this.creating = true;

    const req: InvestmentCreateRequest = {
      investmentProductId: this.investForm.value.investmentProductId,
      sourceAccountId: this.investForm.value.accountId,
      amount: Number(this.investForm.value.amount),
      tenureMonths: Number(this.investForm.value.tenureMonths)
    };

    this.investmentService.createInvestment(req).subscribe({
      next: () => {
        this.creating = false;
        this.showCreateModal = false;
        this.toastService.success('Investment deposit opened successfully!');
        this.loadInitialData();
      },
      error: (err) => {
        this.creating = false;
        this.toastService.error(err?.error?.message || 'Failed to open investment.');
      }
    });
  }

  openWithdrawModal(inv: Investment): void {
    this.withdrawingInv = inv;
    this.withdrawReason = '';
    if (this.accounts.length > 0) {
      this.withdrawAccountId = this.accounts[0].id;
    }
  }

  executeWithdraw(): void {
    if (!this.withdrawingInv || !this.withdrawAccountId) return;
    this.withdrawing = true;

    const req: WithdrawRequest = {
      destinationAccountId: this.withdrawAccountId
    };

    this.investmentService.withdraw(this.withdrawingInv.id, req).subscribe({
      next: () => {
        this.withdrawing = false;
        this.toastService.success('Withdrawal processed. Funds credited to your account.');
        this.withdrawingInv = null;
        this.loadInitialData();
      },
      error: (err) => {
        this.withdrawing = false;
        this.toastService.error(err?.error?.message || 'Withdrawal failed.');
      }
    });
  }
}
