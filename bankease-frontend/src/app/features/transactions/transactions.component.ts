import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../core/services/transaction.service';
import { AccountService } from '../../core/services/account.service';
import { ToastService } from '../../core/services/toast.service';
import { Account } from '../../core/models/account.model';
import { Transaction, TransactionFilter, TransactionType, TransactionStatus } from '../../core/models/transaction.model';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr.pipe';
import { MaskAccountPipe } from '../../shared/pipes/mask-account.pipe';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-transactions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyInrPipe,
    MaskAccountPipe,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="transactions-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Transaction Ledger</h1>
          <p class="page-subtitle">Search, filter, and audit detailed debit and credit history</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="printLedger()">
            <span class="material-symbols-outlined">print</span>
            Print / Export
          </button>
        </div>
      </div>

      <!-- Filters Bar -->
      <div class="card p-4 filter-bar">
        <div class="grid grid-cols-5 gap-3">
          <!-- Account filter -->
          <div class="form-group">
            <label class="form-label text-xs">Filter by Account</label>
            <select class="form-control form-control-sm" [(ngModel)]="filterAccountId" (change)="applyFilters()">
              <option [ngValue]="null">All Linked Accounts</option>
              <option *ngFor="let acc of accounts; trackBy: trackAccount" [ngValue]="acc.id">
                {{ acc.accountType }} ({{ acc.accountNumber | maskAccount }})
              </option>
            </select>
          </div>

          <!-- Type Filter -->
          <div class="form-group">
            <label class="form-label text-xs">Transaction Type</label>
            <select class="form-control form-control-sm" [(ngModel)]="filterType" (change)="applyFilters()">
              <option value="">All Types</option>
              <option value="CREDIT">Credit Only</option>
              <option value="DEBIT">Debit Only</option>
            </select>
          </div>

          <!-- Status Filter -->
          <div class="form-group">
            <label class="form-label text-xs">Status</label>
            <select class="form-control form-control-sm" [(ngModel)]="filterStatus" (change)="applyFilters()">
              <option value="">All Statuses</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="PENDING">PENDING</option>
              <option value="FAILED">FAILED</option>
              <option value="REVERSED">REVERSED</option>
            </select>
          </div>

          <!-- Search term -->
          <div class="form-group">
            <label class="form-label text-xs">Search Reference / Remarks</label>
            <input
              type="text"
              class="form-control form-control-sm"
              placeholder="e.g. TXN- or Rent"
              [(ngModel)]="searchTerm"
            />
          </div>

          <!-- Reset Button -->
          <div class="form-group flex items-end">
            <button class="btn btn-ghost btn-sm w-full" (click)="resetFilters()">
              <span class="material-symbols-outlined">restart_alt</span>
              Reset
            </button>
          </div>
        </div>
      </div>

      <!-- Table Section -->
      <div class="section-card">
        <app-loading-spinner *ngIf="loading" message="Loading transactions..."></app-loading-spinner>

        <div *ngIf="!loading && displayedTransactions.length === 0" class="p-4">
          <app-empty-state
            icon="receipt_long"
            title="No Transactions Found"
            description="No transactions match the selected filters."
          ></app-empty-state>
        </div>

        <div class="table-container" *ngIf="!loading && displayedTransactions.length > 0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Reference ID</th>
                <th>Date & Time</th>
                <th>Description</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let tx of displayedTransactions; trackBy: trackTransaction">
                <td class="font-mono text-xs font-semibold">{{ tx.referenceNumber }}</td>
                <td class="text-xs text-muted">
                  {{ tx.createdAt | date:'mediumDate' }}
                  <span class="text-slate-400">{{ tx.createdAt | date:'shortTime' }}</span>
                </td>
                <td class="font-medium">{{ tx.description || 'Electronic Funds Transfer' }}</td>
                <td>
                  <span class="type-pill" [class.credit]="tx.type === 'CREDIT'" [class.debit]="tx.type === 'DEBIT'">
                    {{ tx.type }}
                  </span>
                </td>
                <td class="font-bold text-base" [class.text-emerald]="tx.type === 'CREDIT'" [class.text-rose]="tx.type === 'DEBIT'">
                  {{ tx.type === 'CREDIT' ? '+' : '-' }}{{ tx.amount | currencyInr }}
                </td>
                <td>
                  <app-status-badge [status]="tx.status"></app-status-badge>
                </td>
                <td>
                  <button class="btn btn-ghost btn-sm" (click)="selectedTx = tx">
                    Details
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        <div class="pagination-bar" *ngIf="totalPages > 1">
          <span class="page-info">
            Page {{ currentPage + 1 }} of {{ totalPages }} ({{ totalElements }} transactions)
          </span>
          <div class="page-btns">
            <button
              class="btn btn-secondary btn-sm"
              [disabled]="currentPage === 0"
              (click)="changePage(currentPage - 1)"
            >
              Previous
            </button>
            <button
              class="btn btn-secondary btn-sm"
              [disabled]="currentPage >= totalPages - 1"
              (click)="changePage(currentPage + 1)"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <!-- Transaction Details Modal -->
      <div class="modal-overlay" *ngIf="selectedTx" (click)="selectedTx = null">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Transaction Details</h3>
            <button class="btn-close" (click)="selectedTx = null">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="tx-modal-header text-center pb-3 border-b border-slate-200">
              <div class="amount-val" [class.text-emerald]="selectedTx.type === 'CREDIT'" [class.text-rose]="selectedTx.type === 'DEBIT'">
                {{ selectedTx.type === 'CREDIT' ? '+' : '-' }}{{ selectedTx.amount | currencyInr }}
              </div>
              <span class="text-xs text-muted">{{ selectedTx.createdAt | date:'medium' }}</span>
            </div>

            <div class="py-3 flex flex-col gap-2 text-sm">
              <div class="flex justify-between">
                <span class="text-muted">Reference Number:</span>
                <span class="font-mono font-bold">{{ selectedTx.referenceNumber }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Transaction Type:</span>
                <span class="font-semibold">{{ selectedTx.type }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Account Number:</span>
                <span class="font-mono">{{ selectedTx.accountNumber || 'Primary Account' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Status:</span>
                <app-status-badge [status]="selectedTx.status"></app-status-badge>
              </div>
              <div class="flex justify-between" *ngIf="selectedTx.description">
                <span class="text-muted">Description / Remarks:</span>
                <span>{{ selectedTx.description }}</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="selectedTx = null">Close</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .transactions-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
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

    .filter-bar {
      background: var(--bg-card);
      border: 1px solid var(--border);
    }

    .section-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
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

      &.credit { background: rgba(16, 185, 129, 0.12); color: #059669; }
      &.debit { background: rgba(225, 29, 72, 0.12); color: #E11D48; }
    }

    .pagination-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 20px;
      border-top: 1px solid var(--border);
      background: #F8FAFC;

      .page-info {
        font-size: 0.8rem;
        color: var(--text-muted);
      }

      .page-btns {
        display: flex;
        gap: 8px;
      }
    }

    .tx-modal-header {
      .amount-val {
        font-size: 1.8rem;
        font-weight: 800;
        letter-spacing: -0.02em;
      }
    }

    @media (max-width: 1024px) {
      .grid-cols-5 { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 640px) {
      .grid-cols-5 { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class TransactionsComponent implements OnInit {
  loading = true;

  accounts: Account[] = [];
  transactions: Transaction[] = [];

  filterAccountId: number | null = null;
  filterType = '';
  filterStatus = '';
  searchTerm = '';

  currentPage = 0;
  pageSize = 15;
  totalPages = 1;
  totalElements = 0;

  selectedTx: Transaction | null = null;

  constructor(
    private transactionService: TransactionService,
    private accountService: AccountService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  trackAccount = (_: number, acc: Account) => acc.id;
  trackTransaction = (_: number, tx: Transaction) => tx.id;

  ngOnInit(): void {
    this.accountService.getAccounts().subscribe(accs => this.accounts = accs || []);
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.loading = true;

    const filter: TransactionFilter = {
      accountId: this.filterAccountId || undefined,
      type: this.filterType ? (this.filterType as TransactionType) : undefined,
      status: this.filterStatus ? (this.filterStatus as TransactionStatus) : undefined,
      page: this.currentPage,
      size: this.pageSize
    };

    this.transactionService.getTransactions(filter).subscribe({
      next: (res) => {
        this.transactions = res?.content || [];
        this.totalPages = res?.totalPages || 1;
        this.totalElements = res?.totalElements || 0;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
        this.toastService.error('Failed to load transaction ledger.');
      }
    });
  }

  get displayedTransactions(): Transaction[] {
    if (!this.searchTerm.trim()) {
      return this.transactions;
    }
    const q = this.searchTerm.toLowerCase();
    return this.transactions.filter(t =>
      (t.referenceNumber && t.referenceNumber.toLowerCase().includes(q)) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadTransactions();
  }

  resetFilters(): void {
    this.filterAccountId = null;
    this.filterType = '';
    this.filterStatus = '';
    this.searchTerm = '';
    this.currentPage = 0;
    this.loadTransactions();
  }

  changePage(newPage: number): void {
    if (newPage >= 0 && newPage < this.totalPages) {
      this.currentPage = newPage;
      this.loadTransactions();
    }
  }

  printLedger(): void {
    window.print();
  }
}
