import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AccountService } from '../../core/services/account.service';
import { ToastService } from '../../core/services/toast.service';
import { Account, BalanceResponse } from '../../core/models/account.model';
import { Transaction } from '../../core/models/transaction.model';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr.pipe';
import { MaskAccountPipe } from '../../shared/pipes/mask-account.pipe';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-accounts',
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
    <div class="accounts-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Accounts & Statements</h1>
          <p class="page-subtitle">View detailed balances, account details, and statement activity</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="loadAccounts()" [disabled]="loading">
            <span class="material-symbols-outlined">refresh</span>
            Refresh Balances
          </button>
          <a routerLink="/transfers" class="btn btn-primary">
            <span class="material-symbols-outlined">send_money</span>
            Initiate Transfer
          </a>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-spinner *ngIf="loading && accounts.length === 0" message="Loading your accounts..."></app-loading-spinner>

      <!-- Error State -->
      <div *ngIf="errorMessage && accounts.length === 0" class="card error-banner mb-4">
        <div class="banner-body">
          <span class="material-symbols-outlined icon">error</span>
          <div class="banner-text">
            <strong>Unable to load accounts</strong>
            <p>{{ errorMessage }}</p>
          </div>
          <button class="btn btn-secondary btn-sm" (click)="loadAccounts()">Retry</button>
        </div>
      </div>

      <div class="accounts-layout" *ngIf="accounts.length > 0">
        <!-- Accounts List Column (Left) -->
        <div class="accounts-list-col">
          <h3 class="list-heading">Your Accounts ({{ accounts.length }})</h3>

          <div class="cards-stack">
            <div
              *ngFor="let acc of accounts; trackBy: trackAccount"
              class="account-selector-card"
              [class.active]="selectedAccount?.id === acc.id"
              (click)="selectAccount(acc)"
            >
              <div class="card-top">
                <div class="type-tag">
                  <span class="material-symbols-outlined">account_balance</span>
                  <span>{{ acc.accountType }}</span>
                </div>
                <app-status-badge [status]="acc.status"></app-status-badge>
              </div>

              <div class="card-number">
                {{ acc.accountNumber | maskAccount }}
              </div>

              <div class="card-balance">
                <span class="label">Balance</span>
                <span class="amount">{{ acc.balance | currencyInr }}</span>
              </div>

              <div class="card-bottom">
                <span class="branch">{{ acc.branchName }}</span>
                <span class="ifsc">{{ acc.ifscCode }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Selected Account Details & Transactions Column (Right) -->
        <div class="account-details-col" *ngIf="selectedAccount">
          <!-- Account Summary Card -->
          <div class="section-card mb-4">
            <div class="section-header">
              <div>
                <h2 class="section-title">{{ selectedAccount.accountType }} Account Details</h2>
                <span class="text-xs text-muted">Account ID: #{{ selectedAccount.id }} &bull; Opened on {{ selectedAccount.createdAt | date:'mediumDate' }}</span>
              </div>
              <div class="flex gap-2">
                <button class="btn btn-secondary btn-sm" (click)="refreshSelectedBalance()" [disabled]="refreshingBalance">
                  <span class="material-symbols-outlined">{{ refreshingBalance ? 'hourglass_top' : 'sync' }}</span>
                  Verify Balance
                </button>
                <a [routerLink]="['/transfers']" [queryParams]="{ fromAccountId: selectedAccount.id }" class="btn btn-primary btn-sm">
                  <span class="material-symbols-outlined">send</span>
                  Transfer Out
                </a>
              </div>
            </div>

            <div class="details-grid">
              <div class="detail-item">
                <span class="detail-label">Account Number</span>
                <span class="detail-value font-mono">{{ selectedAccount.accountNumber }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Current Balance</span>
                <span class="detail-value text-emerald font-semibold">{{ selectedAccount.balance | currencyInr }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Available Balance</span>
                <span class="detail-value text-emerald font-semibold">
                  {{ (liveBalance?.availableBalance ?? selectedAccount.balance) | currencyInr }}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Account Status</span>
                <span class="detail-value">
                  <app-status-badge [status]="selectedAccount.status"></app-status-badge>
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">IFSC Code</span>
                <span class="detail-value font-mono">{{ selectedAccount.ifscCode }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Branch Name</span>
                <span class="detail-value">{{ selectedAccount.branchName }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Currency</span>
                <span class="detail-value">{{ selectedAccount.currency || 'INR' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Holding Type</span>
                <span class="detail-value">Individual / Primary</span>
              </div>
            </div>
          </div>

          <!-- Account Specific Statement / Activity -->
          <div class="section-card">
            <div class="section-header">
              <div>
                <h3 class="section-title">Account Activity Statement</h3>
                <p class="section-desc">Recent ledger entries for {{ selectedAccount.accountNumber | maskAccount }}</p>
              </div>
              <button class="btn btn-ghost btn-sm" (click)="printStatement()">
                <span class="material-symbols-outlined">print</span>
                Print Statement
              </button>
            </div>

            <app-loading-spinner *ngIf="loadingTransactions" message="Loading ledger entries..."></app-loading-spinner>

            <div *ngIf="!loadingTransactions && accountTransactions.length === 0" class="p-4">
              <app-empty-state
                icon="receipt_long"
                title="No Ledger Activity"
                description="There are no recorded transactions on this specific account yet."
              ></app-empty-state>
            </div>

            <div class="table-container" *ngIf="!loadingTransactions && accountTransactions.length > 0">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Date & Time</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let tx of accountTransactions; trackBy: trackTransaction">
                    <td class="font-mono text-xs text-muted">{{ tx.referenceNumber }}</td>
                    <td class="text-xs text-muted">{{ tx.createdAt | date:'mediumDate' }} {{ tx.createdAt | date:'shortTime' }}</td>
                    <td class="font-medium">{{ tx.description || 'Account Transaction' }}</td>
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
        </div>
      </div>

      <div *ngIf="!loading && accounts.length === 0 && !errorMessage">
        <app-empty-state
          icon="account_balance"
          title="No Accounts Found"
          description="Your profile currently has no associated bank accounts. Contact your branch administrator."
        ></app-empty-state>
      </div>
    </div>
  `,
  styles: [`
    .accounts-page {
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

      .header-actions {
        display: flex;
        gap: 10px;
        align-items: center;
      }
    }

    .accounts-layout {
      display: grid;
      grid-template-columns: 340px 1fr;
      gap: 24px;
      align-items: start;
    }

    .accounts-list-col {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .list-heading {
        font-size: 0.9rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--text-muted);
        margin: 0;
      }

      .cards-stack {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
    }

    .account-selector-card {
      background: var(--bg-card);
      border: 2px solid var(--border);
      border-radius: var(--radius-md);
      padding: 18px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      gap: 12px;

      &:hover {
        border-color: #94A3B8;
        transform: translateY(-1px);
        box-shadow: var(--shadow-sm);
      }

      &.active {
        border-color: var(--primary-accent);
        background: #F8FAFC;
        box-shadow: 0 4px 14px rgba(37, 99, 235, 0.12);
      }

      .card-top {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .type-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--primary);

          .material-symbols-outlined { font-size: 18px; }
        }
      }

      .card-number {
        font-family: monospace;
        font-size: 1.05rem;
        font-weight: 600;
        color: var(--text-main);
        letter-spacing: 0.05em;
      }

      .card-balance {
        display: flex;
        flex-direction: column;

        .label {
          font-size: 0.72rem;
          text-transform: uppercase;
          color: var(--text-muted);
          font-weight: 600;
        }

        .amount {
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--primary-accent);
        }
      }

      .card-bottom {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.75rem;
        color: var(--text-muted);
        border-top: 1px dashed var(--border);
        padding-top: 10px;
      }
    }

    .account-details-col {
      display: flex;
      flex-direction: column;
      gap: 20px;
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
          font-size: 1.15rem;
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

    .details-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 18px;
      padding: 24px;

      .detail-item {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .detail-label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--text-muted);
        }

        .detail-value {
          font-size: 0.95rem;
          color: var(--text-main);
          font-weight: 500;
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

    .error-banner {
      background: #FFF1F2;
      border-left: 4px solid #E11D48;
      padding: 16px;

      .banner-body {
        display: flex;
        align-items: center;
        gap: 14px;

        .icon { color: #E11D48; font-size: 28px; }
        .banner-text { flex: 1; p { margin: 2px 0 0 0; font-size: 0.85rem; color: #9F1239; } }
      }
    }

    @media (max-width: 1024px) {
      .accounts-layout { grid-template-columns: 1fr; }
      .details-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 640px) {
      .details-grid { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class AccountsComponent implements OnInit {
  loading = true;
  refreshingBalance = false;
  loadingTransactions = false;
  errorMessage = '';

  accounts: Account[] = [];
  selectedAccount: Account | null = null;
  liveBalance: BalanceResponse | null = null;
  accountTransactions: Transaction[] = [];

  constructor(
    private accountService: AccountService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  trackAccount = (_: number, acc: Account) => acc.id;
  trackTransaction = (_: number, tx: Transaction) => tx.id;

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.loading = true;
    this.errorMessage = '';

    this.accountService.getAccounts().subscribe({
      next: (data) => {
        this.accounts = data || [];
        this.loading = false;
        this.cdr.markForCheck();

        const pathId = this.route.snapshot.paramMap.get('id');
        if (pathId) {
          const found = this.accounts.find(a => a.id === Number(pathId));
          if (found) {
            this.selectAccount(found);
            return;
          }
        }

        const reqId = this.route.snapshot.queryParams['id'] ? Number(this.route.snapshot.queryParams['id']) : null;
        if (reqId) {
          const found = this.accounts.find(a => a.id === reqId);
          if (found) {
            this.selectAccount(found);
            return;
          }
        }
        if (this.accounts.length > 0 && !this.selectedAccount) {
          this.selectAccount(this.accounts[0]);
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Failed to load account information from server.';
        this.cdr.markForCheck();
      }
    });
  }

  selectAccount(acc: Account): void {
    this.selectedAccount = acc;
    this.liveBalance = null;
    this.cdr.markForCheck();
    this.loadAccountTransactions(acc.id);
  }

  refreshSelectedBalance(): void {
    if (!this.selectedAccount) return;
    this.refreshingBalance = true;
    this.cdr.markForCheck();

    this.accountService.getBalance(this.selectedAccount.id).subscribe({
      next: (bal) => {
        this.liveBalance = bal;
        const currentBal = bal.currentBalance ?? bal.balance;
        if (this.selectedAccount) {
          this.selectedAccount.balance = currentBal;
        }
        this.refreshingBalance = false;
        this.cdr.markForCheck();
        this.toastService.success(`Live balance refreshed: ₹${currentBal.toLocaleString('en-IN')}`);
      },
      error: () => {
        this.refreshingBalance = false;
        this.cdr.markForCheck();
        this.toastService.error('Could not refresh live balance from core banking service.');
      }
    });
  }

  loadAccountTransactions(accId: number): void {
    this.loadingTransactions = true;
    this.accountTransactions = [];

    this.accountService.getAccountTransactions(accId, 0, 15).subscribe({
      next: (res) => {
        this.accountTransactions = res?.content || [];
        this.loadingTransactions = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingTransactions = false;
        this.cdr.markForCheck();
      }
    });
  }

  printStatement(): void {
    window.print();
  }
}
