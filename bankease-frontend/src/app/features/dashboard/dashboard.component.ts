import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { AccountService } from '../../core/services/account.service';
import { TransactionService } from '../../core/services/transaction.service';
import { LoanService } from '../../core/services/loan.service';
import { InvestmentService } from '../../core/services/investment.service';
import { Account } from '../../core/models/account.model';
import { Transaction } from '../../core/models/transaction.model';
import { Loan } from '../../core/models/loan.model';
import { PortfolioSummary } from '../../core/models/investment.model';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr.pipe';
import { MaskAccountPipe } from '../../shared/pipes/mask-account.pipe';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    CurrencyInrPipe,
    MaskAccountPipe,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="dashboard-page">
      <!-- Loading State -->
      <app-loading-spinner *ngIf="loading" message="Loading your financial dashboard..."></app-loading-spinner>

      <!-- Error State -->
      <div *ngIf="errorMessage && !loading" class="card error-banner mb-4">
        <div class="banner-body">
          <span class="material-symbols-outlined icon">error</span>
          <div class="banner-text">
            <strong>Unable to load dashboard data</strong>
            <p>{{ errorMessage }}</p>
          </div>
          <button class="btn btn-secondary btn-sm" (click)="loadDashboardData()">Retry</button>
        </div>
      </div>

      <ng-container *ngIf="!loading">
        <!-- Welcome & Quick Action Bar -->
        <div class="welcome-header">
          <div class="welcome-text">
            <span class="badge badge-subtle mb-1">
              <span class="material-symbols-outlined icon">verified</span>
              KYC Verified Customer
            </span>
            <h1 class="page-title">Welcome back, {{ (authService.currentUser$ | async)?.fullName || 'Customer' }}</h1>
            <p class="page-subtitle">Here is a real-time summary of your accounts and recent transactions.</p>
          </div>
          <div class="quick-actions">
            <a routerLink="/transfers" class="btn btn-primary">
              <span class="material-symbols-outlined">send_money</span>
              Transfer Funds
            </a>
            <a routerLink="/bills" class="btn btn-secondary">
              <span class="material-symbols-outlined">receipt_long</span>
              Pay Bills
            </a>
            <a routerLink="/loans" class="btn btn-secondary">
              <span class="material-symbols-outlined">account_balance</span>
              Apply Loan
            </a>
          </div>
        </div>

        <!-- Metric Stat Cards -->
        <div class="grid grid-cols-4 gap-4 mb-4">
          <!-- Total Balance -->
          <div class="stat-card balance-card">
            <div class="stat-header">
              <span class="stat-label">Total Net Balance</span>
              <button class="btn-icon" (click)="hideBalance = !hideBalance" [title]="hideBalance ? 'Show balance' : 'Hide balance'">
                <span class="material-symbols-outlined">{{ hideBalance ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
            <div class="stat-value">
              <span *ngIf="!hideBalance">{{ totalBalance | currencyInr }}</span>
              <span *ngIf="hideBalance">₹ ••••••••</span>
            </div>
            <div class="stat-meta">
              <span class="meta-badge positive">
                <span class="material-symbols-outlined">account_balance_wallet</span>
                {{ accounts.length }} Active Account{{ accounts.length === 1 ? '' : 's' }}
              </span>
            </div>
          </div>

          <!-- Total Loans -->
          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-label">Active Loans</span>
              <span class="material-symbols-outlined stat-icon icon-amber">account_balance</span>
            </div>
            <div class="stat-value">
              {{ activeLoanCount }}
            </div>
            <div class="stat-meta">
              <span class="text-muted">Outstanding: </span>
              <strong class="text-dark">{{ totalLoanOutstanding | currencyInr }}</strong>
            </div>
          </div>

          <!-- Portfolio Value -->
          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-label">Investments</span>
              <span class="material-symbols-outlined stat-icon icon-emerald">trending_up</span>
            </div>
            <div class="stat-value">
              {{ (portfolio?.currentValue || 0) | currencyInr }}
            </div>
            <div class="stat-meta">
              <span class="meta-badge" [class.positive]="(portfolio?.totalReturns || 0) >= 0" [class.negative]="(portfolio?.totalReturns || 0) < 0">
                <span class="material-symbols-outlined">{{ (portfolio?.totalReturns || 0) >= 0 ? 'arrow_upward' : 'arrow_downward' }}</span>
                {{ (portfolio?.totalReturns || 0) | currencyInr }} return
              </span>
            </div>
          </div>

          <!-- Quick Security Status -->
          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-label">Security & Status</span>
              <span class="material-symbols-outlined stat-icon icon-blue">shield</span>
            </div>
            <div class="stat-value text-base">
              2FA Active
            </div>
            <div class="stat-meta">
              <span class="meta-badge positive">
                <span class="material-symbols-outlined">lock</span>
                TLS 1.3 Protected
              </span>
            </div>
          </div>
        </div>

        <!-- Accounts Grid -->
        <div class="section-card mb-4">
          <div class="section-header">
            <div>
              <h2 class="section-title">My Accounts</h2>
              <p class="section-desc">Manage and view balances across your BankEase savings and checking accounts</p>
            </div>
            <a routerLink="/accounts" class="btn btn-secondary btn-sm">
              Manage Accounts
              <span class="material-symbols-outlined">arrow_forward</span>
            </a>
          </div>

          <div *ngIf="accounts.length === 0" class="p-4">
            <app-empty-state
              icon="account_balance"
              title="No Accounts Found"
              description="You do not have any active bank accounts registered yet."
            ></app-empty-state>
          </div>

          <div class="grid grid-cols-2 gap-4" *ngIf="accounts.length > 0">
            <div *ngFor="let acc of accounts; trackBy: trackAccount" class="account-card">
              <div class="acc-top">
                <div class="acc-type">
                  <span class="material-symbols-outlined acc-icon">savings</span>
                  <div>
                    <h4>{{ acc.accountType }} Account</h4>
                    <span class="acc-number">{{ acc.accountNumber | maskAccount }}</span>
                  </div>
                </div>
                <app-status-badge [status]="acc.status"></app-status-badge>
              </div>

              <div class="acc-balance">
                <span class="balance-label">Available Balance</span>
                <span class="balance-amount">
                  {{ hideBalance ? '₹ ••••••••' : (acc.balance | currencyInr) }}
                </span>
              </div>

              <div class="acc-footer">
                <span class="branch-text">
                  <span class="material-symbols-outlined">domain</span>
                  {{ acc.branchName || 'Main Branch' }} &bull; IFSC: {{ acc.ifscCode || 'BANE0001001' }}
                </span>
                <div class="acc-actions">
                  <a [routerLink]="['/accounts']" [queryParams]="{ id: acc.id }" class="btn btn-ghost btn-sm">
                    View Statement
                  </a>
                  <a routerLink="/transfers" [queryParams]="{ fromAccountId: acc.id }" class="btn btn-primary btn-sm">
                    Send Money
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Two Column Section: Recent Transactions & Quick Overview -->
        <div class="grid grid-cols-3 gap-4">
          <!-- Recent Transactions (2 columns wide) -->
          <div class="section-card col-span-2">
            <div class="section-header">
              <div>
                <h2 class="section-title">Recent Transactions</h2>
                <p class="section-desc">Latest activities across all linked accounts</p>
              </div>
              <a routerLink="/transactions" class="btn btn-ghost btn-sm">
                View All
                <span class="material-symbols-outlined">arrow_forward</span>
              </a>
            </div>

            <div *ngIf="transactions.length === 0" class="p-4">
              <app-empty-state
                icon="receipt_long"
                title="No Transactions Yet"
                description="Transactions will show up here once you make your first transfer or deposit."
              ></app-empty-state>
            </div>

            <div class="table-container" *ngIf="transactions.length > 0">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Description</th>
                    <th>Date & Time</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let tx of transactions; trackBy: trackTransaction">
                    <td class="font-mono text-xs text-muted">{{ tx.referenceNumber }}</td>
                    <td class="font-medium">{{ tx.description || 'Fund Transfer' }}</td>
                    <td class="text-xs text-muted">{{ tx.createdAt | date:'mediumDate' }} {{ tx.createdAt | date:'shortTime' }}</td>
                    <td>
                      <span class="type-pill" [class.credit]="tx.type === 'CREDIT'" [class.debit]="tx.type === 'DEBIT'">
                        {{ tx.type }}
                      </span>
                    </td>
                    <td class="font-semibold" [class.text-emerald]="tx.type === 'CREDIT'" [class.text-rose]="tx.type === 'DEBIT'">
                      {{ tx.type === 'CREDIT' ? '+' : '-' }}{{ tx.amount | currencyInr }}
                    </td>
                    <td>
                      <app-status-badge [status]="tx.status"></app-status-badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Quick Shortcuts & Info Panel (1 column) -->
          <div class="flex flex-col gap-4">
            <!-- Quick Transfer Widget -->
            <div class="section-card">
              <div class="section-header">
                <h3 class="section-title text-base">Quick Shortcuts</h3>
              </div>
              <div class="shortcuts-list">
                <a routerLink="/transfers" class="shortcut-item">
                  <div class="shortcut-icon bg-blue-subtle">
                    <span class="material-symbols-outlined">swap_horiz</span>
                  </div>
                  <div class="shortcut-text">
                    <span class="title">Direct Transfer</span>
                    <span class="desc">Transfer to beneficiary</span>
                  </div>
                  <span class="material-symbols-outlined arrow">chevron_right</span>
                </a>

                <a routerLink="/beneficiaries" class="shortcut-item">
                  <div class="shortcut-icon bg-indigo-subtle">
                    <span class="material-symbols-outlined">person_add</span>
                  </div>
                  <div class="shortcut-text">
                    <span class="title">Add Beneficiary</span>
                    <span class="desc">Save trusted payees</span>
                  </div>
                  <span class="material-symbols-outlined arrow">chevron_right</span>
                </a>

                <a routerLink="/bills" class="shortcut-item">
                  <div class="shortcut-icon bg-amber-subtle">
                    <span class="material-symbols-outlined">electric_bolt</span>
                  </div>
                  <div class="shortcut-text">
                    <span class="title">Pay Utility Bill</span>
                    <span class="desc">Electricity, water, recharge</span>
                  </div>
                  <span class="material-symbols-outlined arrow">chevron_right</span>
                </a>

                <a routerLink="/investments" class="shortcut-item">
                  <div class="shortcut-icon bg-emerald-subtle">
                    <span class="material-symbols-outlined">savings</span>
                  </div>
                  <div class="shortcut-text">
                    <span class="title">Open Term Deposit</span>
                    <span class="desc">High interest FD & RD</span>
                  </div>
                  <span class="material-symbols-outlined arrow">chevron_right</span>
                </a>
              </div>
            </div>

            <!-- Security Advisory Card -->
            <div class="section-card advisory-card">
              <div class="advisory-header">
                <span class="material-symbols-outlined icon">security</span>
                <h4>Security Advisory</h4>
              </div>
              <p class="advisory-text">
                BankEase representatives will never ask for your password, PIN, or OTP over phone or email. Keep your credentials private at all times.
              </p>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .welcome-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 20px;
      flex-wrap: wrap;
      margin-bottom: 8px;

      .page-title {
        font-size: 1.65rem;
        font-weight: 700;
        color: var(--text-main);
        letter-spacing: -0.02em;
        margin: 4px 0;
      }

      .page-subtitle {
        font-size: 0.9rem;
        color: var(--text-muted);
        margin: 0;
      }

      .quick-actions {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }
    }

    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 18px 20px;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      gap: 8px;

      &.balance-card {
        background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
        color: #FFFFFF;
        border-color: #334155;

        .stat-label { color: #94A3B8; }
        .stat-value { color: #FFFFFF; }
        .btn-icon { color: #CBD5E1; &:hover { color: #FFFFFF; } }
      }

      .stat-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .stat-label {
        font-size: 0.78rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-muted);
      }

      .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        letter-spacing: -0.02em;
        color: var(--text-main);

        &.text-base {
          font-size: 1.25rem;
        }
      }

      .stat-icon {
        font-size: 22px;
        &.icon-amber { color: #D97706; }
        &.icon-emerald { color: #059669; }
        &.icon-blue { color: #2563EB; }
      }

      .stat-meta {
        font-size: 0.8rem;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .btn-icon {
        background: none;
        border: none;
        cursor: pointer;
        padding: 2px;
        display: flex;
        color: var(--text-muted);
        .material-symbols-outlined { font-size: 18px; }
      }
    }

    .meta-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: var(--radius-sm);

      .material-symbols-outlined { font-size: 14px; }

      &.positive {
        background: rgba(16, 185, 129, 0.12);
        color: #059669;
      }

      &.negative {
        background: rgba(225, 29, 72, 0.12);
        color: #E11D48;
      }
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
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;

        .section-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-main);
          margin: 0;
        }

        .section-desc {
          font-size: 0.82rem;
          color: var(--text-muted);
          margin: 2px 0 0 0;
        }
      }
    }

    .account-card {
      padding: 20px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: #FAFAFA;
      display: flex;
      flex-direction: column;
      gap: 16px;
      transition: all 0.2s ease;

      &:hover {
        border-color: #CBD5E1;
        background: #FFFFFF;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      }

      .acc-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
      }

      .acc-type {
        display: flex;
        align-items: center;
        gap: 12px;

        .acc-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: #EEF2F6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          font-size: 22px;
        }

        h4 {
          font-size: 0.98rem;
          font-weight: 600;
          color: var(--text-main);
          margin: 0;
        }

        .acc-number {
          font-size: 0.82rem;
          font-family: monospace;
          color: var(--text-muted);
        }
      }

      .acc-balance {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .balance-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--text-muted);
          font-weight: 600;
        }

        .balance-amount {
          font-size: 1.45rem;
          font-weight: 700;
          color: var(--primary-accent);
          letter-spacing: -0.01em;
        }
      }

      .acc-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: 12px;
        border-top: 1px dashed var(--border);
        gap: 12px;
        flex-wrap: wrap;

        .branch-text {
          font-size: 0.75rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 4px;
          .material-symbols-outlined { font-size: 14px; }
        }

        .acc-actions {
          display: flex;
          gap: 8px;
        }
      }
    }

    .table-container {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.875rem;

      th {
        padding: 12px 20px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--text-muted);
        background: #F8FAFC;
        border-bottom: 1px solid var(--border);
      }

      td {
        padding: 14px 20px;
        border-bottom: 1px solid var(--border);
        color: var(--text-main);
      }

      tr:last-child td {
        border-bottom: none;
      }

      tr:hover td {
        background: #F8FAFC;
      }
    }

    .type-pill {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;

      &.credit {
        background: rgba(16, 185, 129, 0.12);
        color: #059669;
      }

      &.debit {
        background: rgba(225, 29, 72, 0.12);
        color: #E11D48;
      }
    }

    .shortcuts-list {
      display: flex;
      flex-direction: column;

      .shortcut-item {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 20px;
        border-bottom: 1px solid var(--border);
        color: var(--text-main);
        text-decoration: none;
        transition: background 0.15s ease;

        &:last-child {
          border-bottom: none;
        }

        &:hover {
          background: #F8FAFC;

          .arrow {
            transform: translateX(3px);
            color: var(--primary-accent);
          }
        }

        .shortcut-icon {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;

          .material-symbols-outlined { font-size: 20px; }

          &.bg-blue-subtle { background: #EFF6FF; color: #2563EB; }
          &.bg-indigo-subtle { background: #EEF2FF; color: #4F46E5; }
          &.bg-amber-subtle { background: #FFFBEB; color: #D97706; }
          &.bg-emerald-subtle { background: #ECFDF5; color: #059669; }
        }

        .shortcut-text {
          flex: 1;
          display: flex;
          flex-direction: column;

          .title {
            font-size: 0.88rem;
            font-weight: 600;
            color: var(--text-main);
          }

          .desc {
            font-size: 0.76rem;
            color: var(--text-muted);
          }
        }

        .arrow {
          font-size: 18px;
          color: var(--text-muted);
          transition: transform 0.15s ease, color 0.15s ease;
        }
      }
    }

    .advisory-card {
      padding: 18px;
      background: #F8FAFC;

      .advisory-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;

        .icon {
          color: #2563EB;
          font-size: 20px;
        }

        h4 {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-main);
          margin: 0;
        }
      }

      .advisory-text {
        font-size: 0.78rem;
        line-height: 1.5;
        color: var(--text-muted);
        margin: 0;
      }
    }

    .badge-subtle {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #EFF6FF;
      color: #2563EB;
      font-size: 0.72rem;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 9999px;
      .icon { font-size: 14px; }
    }

    .error-banner {
      background: #FFF1F2;
      border-left: 4px solid #E11D48;
      padding: 16px;

      .banner-body {
        display: flex;
        align-items: center;
        gap: 14px;

        .icon {
          color: #E11D48;
          font-size: 28px;
        }

        .banner-text {
          flex: 1;
          p { margin: 2px 0 0 0; font-size: 0.85rem; color: #9F1239; }
        }
      }
    }

    @media (max-width: 1024px) {
      .grid-cols-4 { grid-template-columns: repeat(2, 1fr); }
      .grid-cols-3 { grid-template-columns: 1fr; }
      .col-span-2 { grid-column: span 1 / span 1; }
    }

    @media (max-width: 640px) {
      .grid-cols-4 { grid-template-columns: 1fr; }
      .grid-cols-2 { grid-template-columns: 1fr; }
      .welcome-header { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  loading = true;
  errorMessage = '';
  hideBalance = false;

  accounts: Account[] = [];
  transactions: Transaction[] = [];
  loans: Loan[] = [];
  portfolio: PortfolioSummary | null = null;

  totalBalance = 0;
  activeLoanCount = 0;
  totalLoanOutstanding = 0;

  constructor(
    public authService: AuthService,
    private accountService: AccountService,
    private transactionService: TransactionService,
    private loanService: LoanService,
    private investmentService: InvestmentService,
    private cdr: ChangeDetectorRef
  ) {}

  trackAccount = (_: number, acc: Account) => acc.id;
  trackTransaction = (_: number, tx: Transaction) => tx.id;

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      accounts: this.accountService.getAccounts().pipe(catchError(() => of([]))),
      transactions: this.transactionService.getTransactions({ size: 5 }).pipe(catchError(() => of({ content: [], page: 0, size: 5, totalElements: 0, totalPages: 0, last: true }))),
      loans: this.loanService.getMyLoans().pipe(catchError(() => of([]))),
      portfolio: this.investmentService.getPortfolio().pipe(catchError(() => of(null)))
    }).subscribe({
      next: (res) => {
        this.accounts = res.accounts || [];
        this.transactions = res.transactions?.content || [];
        this.loans = res.loans || [];
        this.portfolio = res.portfolio || null;

        // Calculate aggregate balances
        this.totalBalance = this.accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
        this.activeLoanCount = this.loans.filter(l => l.status === 'ACTIVE').length;
        this.totalLoanOutstanding = this.loans
          .filter(l => l.status === 'ACTIVE')
          .reduce((sum, l) => sum + (l.remainingBalance || 0), 0);

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Unable to connect to BankEase server. Please check your network.';
        this.cdr.markForCheck();
      }
    });
  }
}
