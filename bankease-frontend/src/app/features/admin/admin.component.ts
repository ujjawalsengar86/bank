import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AdminService } from '../../core/services/admin.service';
import { BillService } from '../../core/services/bill.service';
import { ToastService } from '../../core/services/toast.service';
import { UserProfile } from '../../core/models/user.model';
import { Account, AccountStatus } from '../../core/models/account.model';
import { UserRole, UserStatus } from '../../core/models/auth.model';
import { Biller } from '../../core/models/bill.model';
import { AuditLog } from '../../core/models/admin.model';
import { Transaction } from '../../core/models/transaction.model';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr.pipe';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CurrencyInrPipe,
    StatusBadgeComponent,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div>
          <span class="badge badge-admin mb-1">
            <span class="material-symbols-outlined text-xs">admin_panel_settings</span>
            Super Administrator Control Plane
          </span>
          <h1 class="page-title">BankEase Admin Console</h1>
          <p class="page-subtitle">User provisioning, account states, biller catalog, and comprehensive audit logs</p>
        </div>
      </div>

      <!-- Admin Tabs -->
      <div class="tab-nav">
        <button
          class="tab-btn"
          [class.active]="activeTab === 'USERS'"
          (click)="activeTab = 'USERS'"
        >
          <span class="material-symbols-outlined">group</span>
          Users ({{ users.length }})
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab === 'ACCOUNTS'"
          (click)="activeTab = 'ACCOUNTS'"
        >
          <span class="material-symbols-outlined">account_balance</span>
          Accounts ({{ accounts.length }})
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab === 'BILLERS'"
          (click)="activeTab = 'BILLERS'"
        >
          <span class="material-symbols-outlined">receipt_long</span>
          Billers ({{ billers.length }})
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab === 'AUDIT'"
          (click)="activeTab = 'AUDIT'; loadAuditLogs()"
        >
          <span class="material-symbols-outlined">history_edu</span>
          Audit Logs
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab === 'TRANSACTIONS'"
          (click)="activeTab = 'TRANSACTIONS'; loadTransactions()"
        >
          <span class="material-symbols-outlined">swap_horiz</span>
          Global Transactions
        </button>
      </div>

      <!-- Loading State -->
      <app-loading-spinner *ngIf="loadingInit" message="Loading admin control records..."></app-loading-spinner>

      <ng-container *ngIf="!loadingInit">
        <!-- TAB 1: USERS -->
        <div *ngIf="activeTab === 'USERS'" class="tab-content">
          <div class="section-card">
            <div class="section-header">
              <div>
                <h3 class="section-title">System Users Directory</h3>
                <p class="section-desc">Manage customer, officer, and administrative account permissions</p>
              </div>
              <button class="btn btn-secondary btn-sm" (click)="loadInitialData()">
                <span class="material-symbols-outlined">refresh</span>
                Refresh
              </button>
            </div>

            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Full Name</th>
                    <th>Email Address</th>
                    <th>Mobile</th>
                    <th>Current Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let u of users">
                    <td class="font-mono text-xs">#{{ u.id }}</td>
                    <td class="font-bold">{{ u.fullName }}</td>
                    <td>{{ u.email }}</td>
                    <td class="font-mono text-xs">{{ u.mobile || '-' }}</td>
                    <td>
                      <select
                        class="form-control form-control-sm"
                        [ngModel]="u.role"
                        (ngModelChange)="onRoleChange(u, $event)"
                      >
                        <option value="CUSTOMER">CUSTOMER</option>
                        <option value="BANK_OFFICER">BANK_OFFICER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td>
                      <select
                        class="form-control form-control-sm"
                        [ngModel]="u.accountStatus"
                        (ngModelChange)="onStatusChange(u, $event)"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                        <option value="BLOCKED">BLOCKED</option>
                      </select>
                    </td>
                    <td class="text-xs text-muted">
                      Created {{ u.createdAt | date:'shortDate' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- TAB 2: ACCOUNTS -->
        <div *ngIf="activeTab === 'ACCOUNTS'" class="tab-content">
          <div class="section-card">
            <div class="section-header">
              <div>
                <h3 class="section-title">All Customer Accounts</h3>
                <p class="section-desc">Supervise accounts, balance ceilings, and freeze/unfreeze status</p>
              </div>
            </div>

            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Acc ID</th>
                    <th>Account Number</th>
                    <th>Customer Name</th>
                    <th>Type</th>
                    <th>Balance</th>
                    <th>Branch / IFSC</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let acc of accounts">
                    <td class="font-mono text-xs">#{{ acc.id }}</td>
                    <td class="font-mono font-bold">{{ acc.accountNumber }}</td>
                    <td>{{ acc.userName || 'Account Holder' }}</td>
                    <td><span class="badge badge-subtle">{{ acc.accountType }}</span></td>
                    <td class="font-bold text-emerald">{{ acc.balance | currencyInr }}</td>
                    <td class="text-xs text-muted">{{ acc.branchName }} ({{ acc.ifscCode }})</td>
                    <td>
                      <select
                        class="form-control form-control-sm"
                        [ngModel]="acc.status"
                        (ngModelChange)="onAccountStatusChange(acc, $event)"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="FROZEN">FROZEN</option>
                        <option value="DORMANT">DORMANT</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- TAB 3: BILLERS -->
        <div *ngIf="activeTab === 'BILLERS'" class="tab-content">
          <div class="section-card mb-4">
            <div class="section-header">
              <div>
                <h3 class="section-title">Add Utility Biller</h3>
                <p class="section-desc">Register a new BBPS merchant in BankEase</p>
              </div>
            </div>
            <form [formGroup]="billerForm" (ngSubmit)="createBiller()" class="p-4 grid grid-cols-4 gap-3">
              <div class="form-group">
                <label class="form-label required">Biller Name</label>
                <input type="text" class="form-control" placeholder="e.g. Tata Power" formControlName="name" />
              </div>
              <div class="form-group">
                <label class="form-label required">Category</label>
                <select class="form-control" formControlName="category">
                  <option value="ELECTRICITY">ELECTRICITY</option>
                  <option value="WATER">WATER</option>
                  <option value="INTERNET">INTERNET</option>
                  <option value="MOBILE">MOBILE</option>
                  <option value="GAS">GAS</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label required">Biller Code</label>
                <input type="text" class="form-control font-mono" placeholder="e.g. TATA_ELEC" formControlName="billerCode" />
              </div>
              <div class="form-group flex items-end">
                <button type="submit" class="btn btn-primary w-full" [disabled]="billerForm.invalid || creatingBiller">
                  Add Biller
                </button>
              </div>
            </form>
          </div>

          <div class="section-card">
            <div class="section-header">
              <h3 class="section-title">Active Biller Catalog</h3>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Biller Name</th>
                    <th>Category</th>
                    <th>Biller Code</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let b of billers">
                    <td class="font-mono text-xs">#{{ b.id }}</td>
                    <td class="font-bold">{{ b.name }}</td>
                    <td><span class="badge badge-subtle">{{ b.category }}</span></td>
                    <td class="font-mono">{{ b.billerCode }}</td>
                    <td><app-status-badge [status]="b.active ? 'ACTIVE' : 'INACTIVE'"></app-status-badge></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- TAB 4: AUDIT LOGS -->
        <div *ngIf="activeTab === 'AUDIT'" class="tab-content">
          <div class="section-card">
            <div class="section-header">
              <div>
                <h3 class="section-title">Security Audit Trail</h3>
                <p class="section-desc">Tamper-evident system activity and regulatory trace logs</p>
              </div>
              <button class="btn btn-secondary btn-sm" (click)="loadAuditLogs()">
                <span class="material-symbols-outlined">refresh</span>
                Refresh
              </button>
            </div>

            <app-loading-spinner *ngIf="loadingAudit" message="Fetching audit logs..."></app-loading-spinner>

            <div class="table-container" *ngIf="!loadingAudit">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Entity ID</th>
                    <th>IP Address</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let log of auditLogs">
                    <td class="text-xs text-muted whitespace-nowrap">{{ log.createdAt | date:'medium' }}</td>
                    <td class="font-semibold">{{ log.userEmail || 'SYSTEM' }}</td>
                    <td><span class="action-pill">{{ log.action }}</span></td>
                    <td>{{ log.entityType || 'SYSTEM' }}</td>
                    <td class="font-mono text-xs">#{{ log.entityId || '-' }}</td>
                    <td class="font-mono text-xs text-muted">{{ log.ipAddress || '127.0.0.1' }}</td>
                    <td class="text-xs text-muted max-w-xs truncate">{{ log.description }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- TAB 5: GLOBAL TRANSACTIONS -->
        <div *ngIf="activeTab === 'TRANSACTIONS'" class="tab-content">
          <div class="section-card">
            <div class="section-header">
              <div>
                <h3 class="section-title">Global Ledger Activity</h3>
                <p class="section-desc">Bank-wide transaction stream across all retail accounts</p>
              </div>
              <button class="btn btn-secondary btn-sm" (click)="loadTransactions()">
                <span class="material-symbols-outlined">refresh</span>
                Refresh
              </button>
            </div>

            <app-loading-spinner *ngIf="loadingTransactions" message="Fetching transactions..."></app-loading-spinner>

            <div class="table-container" *ngIf="!loadingTransactions">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Timestamp</th>
                    <th>Account</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let tx of globalTransactions">
                    <td class="font-mono text-xs font-semibold">{{ tx.referenceNumber }}</td>
                    <td class="text-xs text-muted">{{ tx.createdAt | date:'medium' }}</td>
                    <td class="font-mono text-xs">{{ tx.accountNumber || 'Account' }}</td>
                    <td>{{ tx.description }}</td>
                    <td>
                      <span class="type-pill" [class.credit]="tx.type === 'CREDIT'" [class.debit]="tx.type === 'DEBIT'">
                        {{ tx.type }}
                      </span>
                    </td>
                    <td class="font-bold">{{ tx.amount | currencyInr }}</td>
                    <td><app-status-badge [status]="tx.status"></app-status-badge></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .admin-page {
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
        margin: 2px 0 0 0;
      }
      .page-subtitle {
        font-size: 0.9rem;
        color: var(--text-muted);
        margin: 4px 0 0 0;
      }
    }

    .badge-admin {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #7C3AED;
      color: #FFFFFF;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
    }

    .tab-nav {
      display: flex;
      gap: 8px;
      border-bottom: 2px solid var(--border);
      overflow-x: auto;

      .tab-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        padding: 10px 16px;
        font-size: 0.88rem;
        font-weight: 600;
        color: var(--text-muted);
        cursor: pointer;
        transition: all 0.15s ease;
        white-space: nowrap;

        .material-symbols-outlined { font-size: 18px; }

        &:hover { color: var(--text-main); }

        &.active {
          color: #7C3AED;
          border-bottom-color: #7C3AED;
        }
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
        justify-content: space-between;
        align-items: center;
        .section-title { font-size: 1.15rem; font-weight: 600; margin: 0; }
        .section-desc { font-size: 0.82rem; color: var(--text-muted); margin: 2px 0 0 0; }
      }
    }

    .table-container { overflow-x: auto; }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.875rem;

      th {
        padding: 12px 18px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--text-muted);
        background: #F8FAFC;
        border-bottom: 1px solid var(--border);
      }

      td {
        padding: 12px 18px;
        border-bottom: 1px solid var(--border);
      }

      tr:hover td { background: #F8FAFC; }
    }

    .action-pill {
      font-size: 0.72rem;
      font-weight: 700;
      background: #F1F5F9;
      color: #334155;
      padding: 2px 6px;
      border-radius: 4px;
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

    .badge-subtle {
      background: #EFF6FF;
      color: #2563EB;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
    }

    @media (max-width: 900px) {
      .grid-cols-4 { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminComponent implements OnInit {
  loadingInit = true;
  loadingAudit = false;
  loadingTransactions = false;
  creatingBiller = false;

  activeTab: 'USERS' | 'ACCOUNTS' | 'BILLERS' | 'AUDIT' | 'TRANSACTIONS' = 'USERS';

  users: UserProfile[] = [];
  accounts: Account[] = [];
  billers: Biller[] = [];
  auditLogs: AuditLog[] = [];
  globalTransactions: Transaction[] = [];

  billerForm!: FormGroup;

  constructor(
    private adminService: AdminService,
    private billService: BillService,
    private toastService: ToastService,
    private fb: FormBuilder,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.billerForm = this.fb.group({
      name: ['', [Validators.required]],
      category: ['ELECTRICITY', [Validators.required]],
      billerCode: ['', [Validators.required]]
    });

    const routeTab = this.route.snapshot.data['tab'];
    if (routeTab) {
      this.activeTab = routeTab;
      if (routeTab === 'AUDIT') this.loadAuditLogs();
      if (routeTab === 'TRANSACTIONS') this.loadTransactions();
    }

    this.loadInitialData();
  }

  loadInitialData(): void {
    this.loadingInit = true;

    forkJoin({
      users: this.adminService.getAllUsers(),
      accounts: this.adminService.getAllAccounts(),
      billers: this.billService.getBillers()
    }).subscribe({
      next: (res) => {
        this.users = res.users || [];
        this.accounts = res.accounts || [];
        this.billers = res.billers || [];
        this.loadingInit = false;
      },
      error: () => {
        this.loadingInit = false;
        this.toastService.error('Failed to load administrator records.');
      }
    });
  }

  onRoleChange(u: UserProfile, newRole: string): void {
    this.adminService.updateUserRole(u.id, { role: newRole as UserRole }).subscribe({
      next: (updated) => {
        u.role = updated.role;
        this.toastService.success(`User #${u.id} role updated to ${newRole}`);
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Failed to update user role.');
      }
    });
  }

  onStatusChange(u: UserProfile, newStatus: string): void {
    this.adminService.updateUserStatus(u.id, { accountStatus: newStatus as UserStatus }).subscribe({
      next: (updated) => {
        u.accountStatus = updated.accountStatus;
        this.toastService.success(`User #${u.id} status updated to ${newStatus}`);
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Failed to update user status.');
      }
    });
  }

  onAccountStatusChange(acc: Account, newStatus: string): void {
    this.adminService.updateAccountStatus(acc.id, { status: newStatus as AccountStatus }).subscribe({
      next: (updated) => {
        acc.status = updated.status;
        this.toastService.success(`Account #${acc.accountNumber} status updated to ${newStatus}`);
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Failed to update account status.');
      }
    });
  }

  createBiller(): void {
    if (this.billerForm.invalid) return;
    this.creatingBiller = true;

    this.adminService.createBiller(this.billerForm.value).subscribe({
      next: (created) => {
        this.creatingBiller = false;
        this.billers.push(created);
        this.billerForm.reset({ category: 'ELECTRICITY' });
        this.toastService.success('New biller successfully registered!');
      },
      error: (err) => {
        this.creatingBiller = false;
        this.toastService.error(err?.error?.message || 'Failed to create biller.');
      }
    });
  }

  loadAuditLogs(): void {
    this.loadingAudit = true;
    this.adminService.getAuditLogs(0, 50).subscribe({
      next: (res) => {
        this.auditLogs = res?.content || [];
        this.loadingAudit = false;
      },
      error: () => {
        this.loadingAudit = false;
        this.toastService.error('Failed to load audit logs.');
      }
    });
  }

  loadTransactions(): void {
    this.loadingTransactions = true;
    this.adminService.getAllTransactions(0, 50).subscribe({
      next: (res) => {
        this.globalTransactions = res?.content || [];
        this.loadingTransactions = false;
      },
      error: () => {
        this.loadingTransactions = false;
        this.toastService.error('Failed to load transactions.');
      }
    });
  }
}
