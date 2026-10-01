import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { LoanService } from '../../core/services/loan.service';
import { AuthService } from '../../core/services/auth.service';
import { AccountService } from '../../core/services/account.service';
import { ToastService } from '../../core/services/toast.service';
import { Account } from '../../core/models/account.model';
import {
  Loan,
  LoanApplication,
  LoanApplicationRequest,
  LoanPaymentRequest,
  LoanProduct,
  RepaymentScheduleItem
} from '../../core/models/loan.model';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr.pipe';
import { MaskAccountPipe } from '../../shared/pipes/mask-account.pipe';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-loans',
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
    <div class="loans-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Loans & Credit Facilities</h1>
          <p class="page-subtitle">Flexible retail loans with competitive interest rates and transparent repayment</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" (click)="setTab('APPLY')">
            <span class="material-symbols-outlined">add_task</span>
            Apply for Loan
          </button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="tab-nav">
        <button
          class="tab-btn"
          [class.active]="activeTab === 'MY_LOANS'"
          (click)="setTab('MY_LOANS')"
        >
          <span class="material-symbols-outlined">payments</span>
          My Loans & Applications ({{ myLoans.length + myApplications.length }})
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab === 'CALCULATOR'"
          (click)="setTab('CALCULATOR')"
        >
          <span class="material-symbols-outlined">calculate</span>
          Products & EMI Calculator
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab === 'APPLY'"
          (click)="setTab('APPLY')"
        >
          <span class="material-symbols-outlined">description</span>
          New Application
        </button>
        <!-- Officer Review Tab (Officer / Admin only) -->
        <button
          *ngIf="authService.isOfficer() || authService.isAdmin()"
          class="tab-btn officer-tab"
          [class.active]="activeTab === 'OFFICER'"
          (click)="setTab('OFFICER'); loadOfficerApplications()"
        >
          <span class="material-symbols-outlined">admin_panel_settings</span>
          Officer Loan Review
        </button>
      </div>

      <!-- Loading State -->
      <app-loading-spinner *ngIf="loadingInit" message="Loading loan services..."></app-loading-spinner>

      <ng-container *ngIf="!loadingInit">
        <!-- TAB 1: MY LOANS & APPLICATIONS -->
        <div *ngIf="activeTab === 'MY_LOANS'" class="tab-content">
          <!-- Active Loans Section -->
          <div class="section-card mb-4">
            <div class="section-header">
              <div>
                <h3 class="section-title">Active Disbursed Loans</h3>
                <p class="section-desc">Manage existing loans, view repayment schedules, and pay EMIs</p>
              </div>
            </div>

            <div *ngIf="myLoans.length === 0" class="p-4">
              <app-empty-state
                icon="account_balance"
                title="No Active Loans"
                description="You do not have any active loans. Check our loan products or apply online."
                actionLabel="Explore Loan Products"
                (action)="setTab('CALCULATOR')"
              ></app-empty-state>
            </div>

            <div class="grid grid-cols-2 gap-4 p-4" *ngIf="myLoans.length > 0">
              <div *ngFor="let loan of myLoans; trackBy: trackLoan" class="loan-card">
                <div class="loan-top">
                  <div>
                    <span class="badge badge-subtle mb-1">{{ loan.loanType }}</span>
                    <h4>Account #{{ loan.loanAccountNumber | maskAccount }}</h4>
                    <span class="text-xs text-muted">Sanctioned: {{ loan.startDate | date:'mediumDate' }}</span>
                  </div>
                  <app-status-badge [status]="loan.status"></app-status-badge>
                </div>

                <div class="loan-metrics">
                  <div class="metric">
                    <span class="label">Principal Sanctioned</span>
                    <span class="val font-semibold">{{ loan.principalAmount | currencyInr }}</span>
                  </div>
                  <div class="metric">
                    <span class="label">Remaining Balance</span>
                    <span class="val text-rose font-bold">{{ loan.remainingBalance | currencyInr }}</span>
                  </div>
                  <div class="metric">
                    <span class="label">Monthly EMI</span>
                    <span class="val font-bold text-dark">{{ loan.emiAmount | currencyInr }}</span>
                  </div>
                  <div class="metric">
                    <span class="label">Interest Rate</span>
                    <span class="val font-semibold">{{ loan.interestRate }}% p.a.</span>
                  </div>
                </div>

                <div class="loan-actions">
                  <button class="btn btn-secondary btn-sm" (click)="viewSchedule(loan)">
                    <span class="material-symbols-outlined">calendar_month</span>
                    Repayment Schedule
                  </button>
                  <button class="btn btn-primary btn-sm" (click)="openPayModal(loan)" [disabled]="loan.status !== 'ACTIVE'">
                    <span class="material-symbols-outlined">payments</span>
                    Pay EMI
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Pending Applications Section -->
          <div class="section-card">
            <div class="section-header">
              <div>
                <h3 class="section-title">Submitted Applications</h3>
                <p class="section-desc">Track status of submitted loan applications</p>
              </div>
            </div>

            <div *ngIf="myApplications.length === 0" class="p-4 text-center text-muted text-sm">
              No recent loan applications found.
            </div>

            <div class="table-container" *ngIf="myApplications.length > 0">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>App ID</th>
                    <th>Product</th>
                    <th>Requested Amount</th>
                    <th>Tenure</th>
                    <th>Purpose</th>
                    <th>Applied Date</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let app of myApplications; trackBy: trackApp">
                    <td class="font-mono text-xs">#{{ app.id }}</td>
                    <td class="font-semibold">{{ app.loanProductName || 'Retail Loan' }}</td>
                    <td class="font-bold">{{ app.requestedAmount | currencyInr }}</td>
                    <td>{{ app.tenureMonths }} Months</td>
                    <td class="text-xs text-muted">{{ app.purpose }}</td>
                    <td class="text-xs">{{ app.createdAt | date:'mediumDate' }}</td>
                    <td><app-status-badge [status]="app.status"></app-status-badge></td>
                    <td class="text-xs text-rose">{{ app.rejectionReason || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- TAB 2: PRODUCTS & CALCULATOR -->
        <div *ngIf="activeTab === 'CALCULATOR'" class="tab-content">
          <div class="grid grid-cols-2 gap-4">
            <!-- EMI Calculator -->
            <div class="card p-4">
              <h3 class="card-title mb-1">Interactive Loan EMI Calculator</h3>
              <p class="text-xs text-muted mb-4">Calculate exact monthly installments, total interest, and amortized cost</p>

              <div class="calc-inputs">
                <div class="form-group mb-3">
                  <div class="flex justify-between items-center mb-1">
                    <label class="form-label mb-0">Loan Amount</label>
                    <span class="font-bold text-primary">{{ calcAmount | currencyInr }}</span>
                  </div>
                  <input
                    type="range"
                    min="50000"
                    max="5000000"
                    step="25000"
                    [(ngModel)]="calcAmount"
                    (input)="calculateEmi()"
                    class="range-slider"
                  />
                </div>

                <div class="form-group mb-3">
                  <div class="flex justify-between items-center mb-1">
                    <label class="form-label mb-0">Interest Rate (% p.a.)</label>
                    <span class="font-bold text-primary">{{ calcRate }}%</span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="20"
                    step="0.25"
                    [(ngModel)]="calcRate"
                    (input)="calculateEmi()"
                    class="range-slider"
                  />
                </div>

                <div class="form-group mb-3">
                  <div class="flex justify-between items-center mb-1">
                    <label class="form-label mb-0">Tenure (Months)</label>
                    <span class="font-bold text-primary">{{ calcTenure }} Months ({{ calcTenureYears }} Yrs)</span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="120"
                    step="6"
                    [(ngModel)]="calcTenure"
                    (input)="calculateEmi()"
                    class="range-slider"
                  />
                </div>
              </div>

              <!-- Calculator Output -->
              <div class="calc-results mt-4">
                <div class="emi-result-card">
                  <span class="label">Monthly Equated Installment (EMI)</span>
                  <span class="emi-val">{{ calcEmi | currencyInr }}</span>
                </div>

                <div class="grid grid-cols-2 gap-3 mt-3">
                  <div class="result-tile">
                    <span class="label">Total Interest</span>
                    <span class="val text-rose">{{ calcTotalInterest | currencyInr }}</span>
                  </div>
                  <div class="result-tile">
                    <span class="label">Total Payable</span>
                    <span class="val font-bold text-dark">{{ calcTotalPayable | currencyInr }}</span>
                  </div>
                </div>

                <button class="btn btn-primary w-full mt-4" (click)="setTab('APPLY')">
                  Apply with these values
                </button>
              </div>
            </div>

            <!-- Products List -->
            <div class="card p-4">
              <h3 class="card-title mb-1">Available Loan Products</h3>
              <p class="text-xs text-muted mb-3">Approved retail loan schemes offered by BankEase</p>

              <div class="products-list">
                <div *ngFor="let p of products; trackBy: trackProduct" class="product-item">
                  <div class="prod-top">
                    <h4>{{ p.name }}</h4>
                    <span class="rate-badge">{{ p.interestRate }}% p.a.</span>
                  </div>
                  <p class="prod-desc">{{ p.description }}</p>
                  <div class="prod-limits">
                    <span>Limit: {{ p.minAmount | currencyInr }} - {{ p.maxAmount | currencyInr }}</span>
                    <span>Tenure: {{ p.minTenureMonths }} to {{ p.maxTenureMonths }} Mo.</span>
                  </div>
                  <button class="btn btn-secondary btn-sm mt-2" (click)="selectProductForApply(p)">
                    Apply for this
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 3: APPLY FOR LOAN -->
        <div *ngIf="activeTab === 'APPLY'" class="tab-content">
          <div class="card p-4 max-w-2xl mx-auto">
            <h3 class="card-title mb-1">Retail Loan Application</h3>
            <p class="text-xs text-muted mb-4">Submit your credit application for instant officer verification</p>

            <form [formGroup]="applyForm" (ngSubmit)="submitApplication()">
              <div class="form-group mb-3">
                <label class="form-label required">Select Loan Scheme</label>
                <select class="form-control" formControlName="loanProductId">
                  <option [ngValue]="null" disabled>Choose a loan product</option>
                  <option *ngFor="let p of products; trackBy: trackProduct" [ngValue]="p.id">
                    {{ p.name }} - {{ p.interestRate }}% p.a. (Max {{ p.maxAmount | currencyInr }})
                  </option>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-3 mb-3">
                <div class="form-group">
                  <label class="form-label required">Requested Loan Amount (INR)</label>
                  <input
                    type="number"
                    step="1000"
                    min="10000"
                    class="form-control font-bold"
                    placeholder="e.g. 500000"
                    formControlName="requestedAmount"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label required">Tenure (Months)</label>
                  <input
                    type="number"
                    step="6"
                    min="6"
                    max="120"
                    class="form-control"
                    placeholder="e.g. 36"
                    formControlName="tenureMonths"
                  />
                </div>
              </div>

              <div class="form-group mb-3">
                <label class="form-label required">Annual Gross Income (INR)</label>
                <input
                  type="number"
                  step="10000"
                  min="50000"
                  class="form-control"
                  placeholder="e.g. 1200000"
                  formControlName="annualIncome"
                />
              </div>

              <div class="form-group mb-3">
                <label class="form-label required">Disbursement Bank Account</label>
                <select class="form-control" formControlName="disbursementAccountId">
                  <option [ngValue]="null" disabled>Select account for loan credit</option>
                  <option *ngFor="let acc of accounts" [ngValue]="acc.id">
                    {{ acc.accountType }} ({{ acc.accountNumber | maskAccount }}) - Balance: {{ acc.balance | currencyInr }}
                  </option>
                </select>
              </div>

              <div class="form-group mb-3">
                <label class="form-label required">Loan Purpose / Remarks</label>
                <textarea
                  class="form-control"
                  rows="3"
                  placeholder="e.g. Home renovation / Education / Vehicle purchase"
                  formControlName="purpose"
                ></textarea>
              </div>

              <button
                type="submit"
                class="btn btn-primary btn-lg w-full"
                [disabled]="applyForm.invalid || applying"
              >
                {{ applying ? 'Submitting Application...' : 'Submit Loan Application' }}
              </button>
            </form>
          </div>
        </div>

        <!-- TAB 4: OFFICER REVIEW (Role restricted) -->
        <div *ngIf="activeTab === 'OFFICER'" class="tab-content">
          <div class="section-card">
            <div class="section-header">
              <div>
                <h3 class="section-title">All Customer Loan Applications</h3>
                <p class="section-desc">Review credit requests and approve or reject with audit trail</p>
              </div>
              <button class="btn btn-secondary btn-sm" (click)="loadOfficerApplications()">
                <span class="material-symbols-outlined">refresh</span>
                Refresh Queue
              </button>
            </div>

            <app-loading-spinner *ngIf="loadingOfficer" message="Loading applications queue..."></app-loading-spinner>

            <div *ngIf="!loadingOfficer && allApplications.length === 0" class="p-4 text-center text-muted">
              No applications in queue.
            </div>

            <div class="table-container" *ngIf="!loadingOfficer && allApplications.length > 0">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>App ID</th>
                    <th>Customer Name</th>
                    <th>Product</th>
                    <th>Requested</th>
                    <th>Tenure</th>
                    <th>Income</th>
                    <th>Purpose</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let app of allApplications; trackBy: trackApp">
                    <td class="font-mono text-xs">#{{ app.id }}</td>
                    <td class="font-semibold">{{ app.customerName || 'Customer' }}</td>
                    <td>{{ app.loanProductName || 'Retail' }}</td>
                    <td class="font-bold">{{ app.requestedAmount | currencyInr }}</td>
                    <td>{{ app.tenureMonths }} Mo.</td>
                    <td>{{ (app.annualIncome || 0) | currencyInr }}</td>
                    <td class="text-xs text-muted">{{ app.purpose }}</td>
                    <td><app-status-badge [status]="app.status"></app-status-badge></td>
                    <td>
                      <div class="flex gap-2" *ngIf="app.status === 'PENDING'">
                        <button class="btn btn-primary btn-sm" (click)="approveApplication(app)">
                          Approve
                        </button>
                        <button class="btn btn-danger btn-sm" (click)="openRejectDialog(app)">
                          Reject
                        </button>
                      </div>
                      <span *ngIf="app.status !== 'PENDING'" class="text-xs text-muted">Completed</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- Pay Loan EMI Modal -->
      <div class="modal-overlay" *ngIf="payingLoan" (click)="closePayModal()">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Pay Loan EMI</h3>
            <button class="btn-close" (click)="closePayModal()">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="p-3 bg-slate-50 rounded mb-3">
              <div class="flex justify-between text-sm mb-1">
                <span>Account Number:</span>
                <strong class="font-mono">{{ payingLoan.loanAccountNumber | maskAccount }}</strong>
              </div>
              <div class="flex justify-between text-sm mb-1">
                <span>Outstanding Balance:</span>
                <strong class="text-rose">{{ payingLoan.remainingBalance | currencyInr }}</strong>
              </div>
              <div class="flex justify-between text-sm">
                <span>Monthly Installment:</span>
                <strong class="text-emerald text-base">{{ payingLoan.emiAmount | currencyInr }}</strong>
              </div>
            </div>

            <div class="form-group mb-3">
              <label class="form-label required">Select Debit Account</label>
              <select class="form-control" [(ngModel)]="payFromAccountId">
                <option [ngValue]="null" disabled>Choose Bank Account</option>
                <option *ngFor="let acc of accounts" [ngValue]="acc.id">
                  {{ acc.accountType }} ({{ acc.accountNumber | maskAccount }}) - Balance: {{ acc.balance | currencyInr }}
                </option>
              </select>
            </div>

            <div class="form-group mb-3">
              <label class="form-label required">Payment Amount (INR)</label>
              <input type="number" class="form-control font-bold" [(ngModel)]="payAmount" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closePayModal()">Cancel</button>
            <button class="btn btn-primary" (click)="executePayLoan()" [disabled]="!payFromAccountId || !payAmount">
              Confirm EMI Payment
            </button>
          </div>
        </div>
      </div>

      <!-- Schedule Modal -->
      <div class="modal-overlay" *ngIf="showScheduleModal" (click)="closeScheduleModal()">
        <div class="modal-container max-w-2xl" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Repayment Schedule</h3>
            <button class="btn-close" (click)="closeScheduleModal()">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="modal-body p-0">
            <app-loading-spinner *ngIf="loadingSchedule" message="Loading amortization schedule..."></app-loading-spinner>
            <div class="table-container max-h-96" *ngIf="!loadingSchedule">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Inst #</th>
                    <th>Due Date</th>
                    <th>EMI Amount</th>
                    <th>Principal</th>
                    <th>Interest</th>
                    <th>Remaining</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let s of scheduleList; trackBy: trackSchedule">
                    <td>{{ s.installmentNumber }}</td>
                    <td class="text-xs">{{ s.dueDate | date:'mediumDate' }}</td>
                    <td class="font-bold">{{ s.emiAmount | currencyInr }}</td>
                    <td>{{ s.principalPortion | currencyInr }}</td>
                    <td>{{ s.interestPortion | currencyInr }}</td>
                    <td class="text-xs font-mono">{{ s.balanceAfterPayment | currencyInr }}</td>
                    <td><app-status-badge [status]="s.balanceAfterPayment === 0 ? 'ACTIVE' : 'PENDING'" [label]="s.balanceAfterPayment === 0 ? 'PAID' : 'DUE'"></app-status-badge></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeScheduleModal()">Close</button>
          </div>
        </div>
      </div>

      <!-- Reject Application Reason Dialog -->
      <div class="modal-overlay" *ngIf="rejectingApp" (click)="closeRejectDialog()">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Reject Application</h3>
            <button class="btn-close" (click)="closeRejectDialog()">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="modal-body">
            <p class="text-sm text-muted mb-2">
              Provide an official credit assessment reason for rejecting App #{{ rejectingApp.id }}.
            </p>
            <div class="form-group">
              <label class="form-label required">Rejection Reason</label>
              <textarea
                class="form-control"
                rows="3"
                [(ngModel)]="rejectionReason"
                placeholder="e.g. Debt-to-income ratio exceeds regulatory threshold."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeRejectDialog()">Cancel</button>
            <button class="btn btn-danger" (click)="executeRejectApplication()" [disabled]="!rejectionReason.trim()">
              Confirm Rejection
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .loans-page {
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

    .tab-nav {
      display: flex;
      gap: 8px;
      border-bottom: 2px solid var(--border);
      padding-bottom: 2px;
      overflow-x: auto;

      .tab-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        margin-bottom: -4px;
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
          color: var(--primary-accent);
          border-bottom-color: var(--primary-accent);
        }

        &.officer-tab.active {
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

    .loan-card {
      background: #F8FAFC;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 14px;

      .loan-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;

        h4 { margin: 2px 0 0 0; font-size: 1rem; font-weight: 700; }
      }

      .loan-metrics {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        background: #FFFFFF;
        padding: 12px;
        border-radius: var(--radius-sm);
        border: 1px solid #E2E8F0;

        .metric {
          display: flex;
          flex-direction: column;
          gap: 2px;
          .label { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; }
          .val { font-size: 0.95rem; }
        }
      }

      .loan-actions {
        display: flex;
        gap: 8px;
      }
    }

    .range-slider {
      width: 100%;
      height: 6px;
      border-radius: 4px;
      background: #CBD5E1;
      outline: none;
      cursor: pointer;
    }

    .calc-results {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: var(--radius-md);
      padding: 18px;

      .emi-result-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 4px;

        .label { font-size: 0.78rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); }
        .emi-val { font-size: 1.85rem; font-weight: 800; color: var(--primary-accent); }
      }

      .result-tile {
        background: #FFFFFF;
        padding: 10px;
        border-radius: var(--radius-sm);
        border: 1px solid #E2E8F0;
        display: flex;
        flex-direction: column;
        gap: 2px;
        .label { font-size: 0.72rem; color: var(--text-muted); }
        .val { font-size: 0.95rem; }
      }
    }

    .products-list {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .product-item {
        background: #F8FAFC;
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        padding: 14px;

        .prod-top {
          display: flex;
          justify-content: space-between;
          align-items: center;

          h4 { margin: 0; font-size: 0.95rem; font-weight: 700; }
          .rate-badge { background: #ECFDF5; color: #059669; font-weight: 700; font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; }
        }

        .prod-desc { font-size: 0.8rem; color: var(--text-muted); margin: 4px 0 8px 0; }
        .prod-limits { font-size: 0.75rem; color: #475569; display: flex; justify-content: space-between; }
      }
    }

    .badge-subtle {
      display: inline-block;
      background: #EFF6FF;
      color: #2563EB;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .table-container { overflow-x: auto; }
    .max-w-2xl { max-width: 42rem; }
    .max-h-96 { max-height: 24rem; overflow-y: auto; }

    @media (max-width: 800px) {
      .grid-cols-2 { grid-template-columns: 1fr; }
    }
  `]
})
export class LoansComponent implements OnInit {
  loadingInit = true;
  loadingOfficer = false;
  loadingSchedule = false;
  applying = false;

  activeTab: 'MY_LOANS' | 'CALCULATOR' | 'APPLY' | 'OFFICER' = 'MY_LOANS';

  accounts: Account[] = [];
  products: LoanProduct[] = [];
  myLoans: Loan[] = [];
  myApplications: LoanApplication[] = [];
  allApplications: LoanApplication[] = [];

  // Calculator
  calcAmount = 500000;
  calcRate = 9.5;
  calcTenure = 36;
  calcEmi = 0;
  calcTotalInterest = 0;
  calcTotalPayable = 0;

  // Apply Form
  applyForm!: FormGroup;

  // Active Loan Repayment & Schedule
  payingLoan: Loan | null = null;
  payFromAccountId: number | null = null;
  payAmount: number = 0;
  showScheduleModal = false;
  scheduleList: RepaymentScheduleItem[] = [];

  // Officer Reject Dialog
  rejectingApp: LoanApplication | null = null;
  rejectionReason: string = '';

  setTab(tab: 'MY_LOANS' | 'CALCULATOR' | 'APPLY' | 'OFFICER'): void {
    this.activeTab = tab;
    this.cdr.markForCheck();
  }

  closePayModal(): void {
    this.payingLoan = null;
    this.cdr.markForCheck();
  }

  closeScheduleModal(): void {
    this.showScheduleModal = false;
    this.cdr.markForCheck();
  }

  closeRejectDialog(): void {
    this.rejectingApp = null;
    this.cdr.markForCheck();
  }

  // TrackBy functions – prevent full list re-renders on change detection
  trackLoan = (_: number, loan: Loan) => loan.id;
  trackApp = (_: number, app: LoanApplication) => app.id;
  trackProduct = (_: number, p: LoanProduct) => p.id;
  trackSchedule = (_: number, s: RepaymentScheduleItem) => s.installmentNumber;

  get calcTenureYears(): string {
    return (this.calcTenure / 12).toFixed(1);
  }

  constructor(
    public authService: AuthService,
    private loanService: LoanService,
    private accountService: AccountService,
    private toastService: ToastService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.calculateEmi();
    this.loadInitialData();
  }

  initForm(): void {
    this.applyForm = this.fb.group({
      loanProductId: [null, [Validators.required]],
      disbursementAccountId: [null, [Validators.required]],
      requestedAmount: [500000, [Validators.required, Validators.min(10000)]],
      tenureMonths: [36, [Validators.required, Validators.min(6), Validators.max(120)]],
      annualIncome: [1000000, [Validators.required, Validators.min(50000)]],
      purpose: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  loadInitialData(): void {
    this.loadingInit = true;

    forkJoin({
      accounts: this.accountService.getAccounts(),
      products: this.loanService.getLoanProducts(),
      myLoans: this.loanService.getMyLoans(),
      myApps: this.loanService.getMyApplications()
    }).subscribe({
      next: (res) => {
        this.accounts = res.accounts || [];
        this.products = res.products || [];
        this.myLoans = res.myLoans || [];
        this.myApplications = res.myApps || [];
        if (this.accounts.length > 0) {
          this.applyForm.patchValue({ disbursementAccountId: this.accounts[0].id });
        }
        if (this.products.length > 0) {
          this.applyForm.patchValue({ loanProductId: this.products[0].id });
          this.calcRate = this.products[0].interestRate;
          this.calculateEmi();
        }
        this.loadingInit = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingInit = false;
        this.cdr.markForCheck();
        this.toastService.error('Failed to load loan data.');
      }
    });
  }

  calculateEmi(): void {
    const P = this.calcAmount;
    const r = (this.calcRate / 12) / 100;
    const n = this.calcTenure;

    if (r === 0) {
      this.calcEmi = P / n;
    } else {
      this.calcEmi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }

    this.calcTotalPayable = this.calcEmi * n;
    this.calcTotalInterest = this.calcTotalPayable - P;
    this.cdr.markForCheck();
  }

  selectProductForApply(p: LoanProduct): void {
    this.calcRate = p.interestRate;
    this.applyForm.patchValue({
      loanProductId: p.id,
      requestedAmount: p.minAmount,
      tenureMonths: p.minTenureMonths
    });
    this.activeTab = 'APPLY';
    this.cdr.markForCheck();
  }

  submitApplication(): void {
    if (this.applyForm.invalid) return;
    this.applying = true;

    const req: LoanApplicationRequest = {
      loanProductId: this.applyForm.value.loanProductId,
      disbursementAccountId: this.applyForm.value.disbursementAccountId,
      requestedAmount: Number(this.applyForm.value.requestedAmount),
      tenureMonths: Number(this.applyForm.value.tenureMonths),
      annualIncome: Number(this.applyForm.value.annualIncome),
      purpose: this.applyForm.value.purpose.trim()
    };

    this.loanService.applyLoan(req).subscribe({
      next: () => {
        this.applying = false;
        this.toastService.success('Loan application submitted for review!');
        this.loanService.getMyApplications().subscribe(apps => {
          this.myApplications = apps || [];
          this.cdr.markForCheck();
        });
        this.activeTab = 'MY_LOANS';
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.applying = false;
        this.cdr.markForCheck();
        this.toastService.error(err?.error?.message || 'Loan application submission failed.');
      }
    });
  }

  viewSchedule(loan: Loan): void {
    this.loadingSchedule = true;
    this.showScheduleModal = true;
    this.scheduleList = [];
    this.cdr.markForCheck();

    this.loanService.getRepaymentSchedule(loan.id).subscribe({
      next: (data) => {
        this.scheduleList = data || [];
        this.loadingSchedule = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingSchedule = false;
        this.cdr.markForCheck();
        this.toastService.error('Failed to load repayment schedule.');
      }
    });
  }

  openPayModal(loan: Loan): void {
    this.payingLoan = loan;
    this.payAmount = loan.emiAmount;
    if (this.accounts.length > 0) {
      this.payFromAccountId = this.accounts[0].id;
    }
    this.cdr.markForCheck();
  }

  executePayLoan(): void {
    if (!this.payingLoan || !this.payFromAccountId || !this.payAmount) return;

    const req: LoanPaymentRequest = {
      sourceAccountId: this.payFromAccountId,
      amount: this.payAmount
    };

    this.loanService.payLoan(this.payingLoan.id, req).subscribe({
      next: () => {
        this.toastService.success('EMI Payment processed successfully!');
        this.payingLoan = null;
        // Refresh loans & accounts
        this.loanService.getMyLoans().subscribe(loans => this.myLoans = loans || []);
        this.accountService.getAccounts().subscribe(accs => this.accounts = accs || []);
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Loan payment failed.');
      }
    });
  }

  loadOfficerApplications(): void {
    this.loadingOfficer = true;
    this.loanService.getAllApplications(0, 50).subscribe({
      next: (res) => {
        this.allApplications = res?.content || [];
        this.loadingOfficer = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingOfficer = false;
        this.cdr.markForCheck();
      }
    });
  }

  approveApplication(app: LoanApplication): void {
    this.loanService.approveLoan(app.id).subscribe({
      next: () => {
        this.toastService.success(`Application #${app.id} approved and loan disbursed!`);
        this.loadOfficerApplications();
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Failed to approve application.');
      }
    });
  }

  openRejectDialog(app: LoanApplication): void {
    this.rejectingApp = app;
    this.rejectionReason = '';
  }

  executeRejectApplication(): void {
    if (!this.rejectingApp) return;

    this.loanService.rejectLoan(this.rejectingApp.id, this.rejectionReason.trim()).subscribe({
      next: () => {
        this.toastService.warning(`Application #${this.rejectingApp?.id} rejected.`);
        this.rejectingApp = null;
        this.loadOfficerApplications();
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Failed to reject application.');
      }
    });
  }
}
