import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BeneficiaryService } from '../../core/services/beneficiary.service';
import { ToastService } from '../../core/services/toast.service';
import { Beneficiary, BeneficiaryRequest } from '../../core/models/beneficiary.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-beneficiaries',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ConfirmationDialogComponent
  ],
  template: `
    <div class="beneficiaries-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Manage Beneficiaries</h1>
          <p class="page-subtitle">Add and maintain trusted transfer payees for instant funds transfer</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" (click)="openAddModal()">
            <span class="material-symbols-outlined">person_add</span>
            Add Beneficiary
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-spinner *ngIf="loading" message="Loading beneficiaries directory..."></app-loading-spinner>

      <!-- Empty State -->
      <div *ngIf="!loading && beneficiaries.length === 0">
        <app-empty-state
          icon="group_add"
          title="No Beneficiaries Registered"
          description="Save payee details here so you can make fast transfers without typing account numbers every time."
          actionLabel="Add Your First Payee"
          (action)="openAddModal()"
        ></app-empty-state>
      </div>

      <!-- Beneficiaries Grid -->
      <div class="grid grid-cols-3 gap-4" *ngIf="!loading && beneficiaries.length > 0">
        <div *ngFor="let b of beneficiaries; trackBy: trackBeneficiary" class="beneficiary-card">
          <div class="card-head">
            <div class="avatar-circle">
              {{ getInitials(b.name) }}
            </div>
            <div class="head-info">
              <h4>{{ b.name }}</h4>
              <span class="bank-name">{{ b.bankName }}</span>
            </div>
            <app-status-badge [status]="b.status"></app-status-badge>
          </div>

          <div class="card-body">
            <div class="info-row">
              <span class="label">Account Number</span>
              <span class="val font-mono">{{ b.accountNumber }}</span>
            </div>
            <div class="info-row">
              <span class="label">IFSC Code</span>
              <span class="val font-mono">{{ b.ifscCode }}</span>
            </div>
          </div>

          <div class="card-actions">
            <a routerLink="/transfers" class="btn btn-primary btn-sm flex-1">
              <span class="material-symbols-outlined">send</span>
              Transfer
            </a>
            <button class="btn btn-secondary btn-sm" (click)="openEditModal(b)" title="Edit Payee">
              <span class="material-symbols-outlined">edit</span>
            </button>
            <button class="btn btn-ghost btn-sm text-rose" (click)="confirmDelete(b)" title="Delete Payee">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Add / Edit Modal -->
      <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editingBeneficiaryId ? 'Edit Beneficiary' : 'Add New Beneficiary' }}</h3>
            <button class="btn-close" (click)="closeModal()">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form [formGroup]="beneficiaryForm" (ngSubmit)="saveBeneficiary()">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label required">Beneficiary Full Name</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="e.g. Rahul Sharma"
                  formControlName="name"
                />
                <div class="form-error" *ngIf="isFieldInvalid('name')">Name is required</div>
              </div>

              <div class="form-group">
                <label class="form-label required">Account Number</label>
                <input
                  type="text"
                  class="form-control font-mono"
                  placeholder="e.g. 100010001002"
                  formControlName="accountNumber"
                />
                <div class="form-error" *ngIf="isFieldInvalid('accountNumber')">
                  Valid account number is required (6-24 chars)
                </div>
              </div>

              <div class="form-group">
                <label class="form-label required">Bank Name</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="e.g. BankEase or HDFC Bank"
                  formControlName="bankName"
                />
                <div class="form-error" *ngIf="isFieldInvalid('bankName')">Bank name is required</div>
              </div>

              <div class="form-group">
                <label class="form-label required">IFSC Code</label>
                <input
                  type="text"
                  class="form-control font-mono uppercase"
                  placeholder="e.g. BANE0001234"
                  formControlName="ifscCode"
                />
                <div class="form-error" *ngIf="isFieldInvalid('ifscCode')">
                  IFSC code is required (11 alphanumeric characters)
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="beneficiaryForm.invalid || saving">
                {{ saving ? 'Saving...' : (editingBeneficiaryId ? 'Save Changes' : 'Add Payee') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Delete Confirmation Dialog -->
      <app-confirmation-dialog
        [isOpen]="showDeleteDialog"
        title="Delete Beneficiary"
        [message]="'Are you sure you want to remove ' + (deletingBeneficiary?.name || 'this payee') + ' from your beneficiaries list?'"
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        confirmButtonClass="btn-danger"
        (confirm)="executeDelete()"
        (cancel)="showDeleteDialog = false"
      ></app-confirmation-dialog>
    </div>
  `,
  styles: [`
    .beneficiaries-page {
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

    .beneficiary-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      transition: all 0.2s ease;

      &:hover {
        border-color: #CBD5E1;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      }

      .card-head {
        display: flex;
        align-items: center;
        gap: 12px;

        .avatar-circle {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #EEF2FF;
          color: #4F46E5;
          font-weight: 700;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .head-info {
          flex: 1;
          min-width: 0;

          h4 {
            font-size: 0.98rem;
            font-weight: 600;
            color: var(--text-main);
            margin: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .bank-name {
            font-size: 0.78rem;
            color: var(--text-muted);
          }
        }
      }

      .card-body {
        display: flex;
        flex-direction: column;
        gap: 8px;
        background: #F8FAFC;
        padding: 12px;
        border-radius: var(--radius-sm);

        .info-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.8rem;

          .label { color: var(--text-muted); }
          .val { color: var(--text-main); font-weight: 500; }
        }
      }

      .card-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: auto;
      }
    }

    .uppercase {
      text-transform: uppercase;
    }

    @media (max-width: 1024px) {
      .grid-cols-3 { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 640px) {
      .grid-cols-3 { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class BeneficiariesComponent implements OnInit {
  loading = true;
  saving = false;
  showModal = false;
  showDeleteDialog = false;

  beneficiaries: Beneficiary[] = [];
  editingBeneficiaryId: number | null = null;
  deletingBeneficiary: Beneficiary | null = null;

  beneficiaryForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private beneficiaryService: BeneficiaryService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  trackBeneficiary = (_: number, b: Beneficiary) => b.id;

  ngOnInit(): void {
    this.initForm();
    this.loadBeneficiaries();
  }

  initForm(): void {
    this.beneficiaryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      accountNumber: ['', [Validators.required, Validators.pattern(/^[0-9A-Za-z]{6,24}$/)]],
      bankName: ['', [Validators.required]],
      ifscCode: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  loadBeneficiaries(): void {
    this.loading = true;
    this.beneficiaryService.getBeneficiaries().subscribe({
      next: (data) => {
        this.beneficiaries = data || [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
        this.toastService.error('Failed to load beneficiaries.');
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return 'B';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }

  isFieldInvalid(field: string): boolean {
    const control = this.beneficiaryForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  openAddModal(): void {
    this.editingBeneficiaryId = null;
    this.beneficiaryForm.reset();
    this.showModal = true;
  }

  openEditModal(b: Beneficiary): void {
    this.editingBeneficiaryId = b.id;
    this.beneficiaryForm.patchValue({
      name: b.name,
      accountNumber: b.accountNumber,
      bankName: b.bankName,
      ifscCode: b.ifscCode
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingBeneficiaryId = null;
  }

  saveBeneficiary(): void {
    if (this.beneficiaryForm.invalid) return;
    this.saving = true;

    const payload: BeneficiaryRequest = {
      name: this.beneficiaryForm.value.name.trim(),
      accountNumber: this.beneficiaryForm.value.accountNumber.trim(),
      bankName: this.beneficiaryForm.value.bankName.trim(),
      ifscCode: this.beneficiaryForm.value.ifscCode.trim().toUpperCase()
    };

    if (this.editingBeneficiaryId) {
      this.beneficiaryService.updateBeneficiary(this.editingBeneficiaryId, payload).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.toastService.success('Beneficiary updated successfully!');
          this.loadBeneficiaries();
        },
        error: (err) => {
          this.saving = false;
          this.cdr.markForCheck();
          this.toastService.error(err?.error?.message || 'Failed to update beneficiary.');
        }
      });
    } else {
      this.beneficiaryService.addBeneficiary(payload).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.toastService.success('Beneficiary added successfully!');
          this.loadBeneficiaries();
        },
        error: (err) => {
          this.saving = false;
          this.cdr.markForCheck();
          this.toastService.error(err?.error?.message || 'Failed to add beneficiary.');
        }
      });
    }
  }

  confirmDelete(b: Beneficiary): void {
    this.deletingBeneficiary = b;
    this.showDeleteDialog = true;
    this.cdr.markForCheck();
  }

  executeDelete(): void {
    if (!this.deletingBeneficiary) return;
    const id = this.deletingBeneficiary.id;
    this.showDeleteDialog = false;
    this.cdr.markForCheck();

    this.beneficiaryService.deleteBeneficiary(id).subscribe({
      next: () => {
        this.toastService.success('Beneficiary removed.');
        this.loadBeneficiaries();
      },
      error: () => {
        this.cdr.markForCheck();
        this.toastService.error('Failed to remove beneficiary.');
      }
    });
  }
}
