import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { UserProfile, UserUpdateRequest, ChangePasswordRequest } from '../../core/models/user.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StatusBadgeComponent,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="profile-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Profile & Security Settings</h1>
          <p class="page-subtitle">Manage your personal identification, contact channels, and security credentials</p>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-spinner *ngIf="loading" message="Loading profile details..."></app-loading-spinner>

      <div class="profile-layout" *ngIf="!loading && profile">
        <!-- Profile Overview Card (Left) -->
        <div class="overview-col">
          <div class="card p-4 text-center profile-badge-card">
            <div class="avatar-large">
              {{ getInitials(profile.fullName) }}
            </div>
            <h2 class="user-name mt-2">{{ profile.fullName }}</h2>
            <span class="user-email text-muted text-sm">{{ profile.email }}</span>
            <div class="mt-2 flex justify-center gap-2">
              <span class="role-badge">{{ profile.role }}</span>
              <app-status-badge [status]="profile.accountStatus"></app-status-badge>
            </div>

            <div class="meta-list mt-4 text-left">
              <div class="meta-row">
                <span class="label">Customer ID</span>
                <span class="val font-mono">#{{ profile.id }}</span>
              </div>
              <div class="meta-row">
                <span class="label">Mobile Phone</span>
                <span class="val font-mono">{{ profile.mobile || 'Not specified' }}</span>
              </div>
              <div class="meta-row">
                <span class="label">KYC Verification</span>
                <span class="val text-emerald font-semibold flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm">verified</span>
                  Verified
                </span>
              </div>
              <div class="meta-row">
                <span class="label">Member Since</span>
                <span class="val">{{ profile.createdAt | date:'mediumDate' }}</span>
              </div>
            </div>
          </div>

          <!-- Security Status Box -->
          <div class="card p-4 mt-4 security-card">
            <div class="flex items-center gap-2 mb-2">
              <span class="material-symbols-outlined text-emerald">lock</span>
              <h4 class="font-bold text-sm">Active Protections</h4>
            </div>
            <ul class="security-list">
              <li>256-bit TLS encrypted session</li>
              <li>Dual-factor authenticated REST switch</li>
              <li>Continuous transaction anomaly monitoring</li>
            </ul>
          </div>
        </div>

        <!-- Forms Column (Right) -->
        <div class="forms-col flex flex-col gap-4">
          <!-- Edit Personal Info Form -->
          <div class="card p-4">
            <h3 class="card-title mb-1">Personal Details</h3>
            <p class="text-xs text-muted mb-4">Keep your contact details up to date for OTP delivery</p>

            <form [formGroup]="profileForm" (ngSubmit)="updateProfile()">
              <div class="grid grid-cols-2 gap-3 mb-3">
                <div class="form-group">
                  <label class="form-label required">Full Legal Name</label>
                  <input type="text" class="form-control" formControlName="fullName" />
                </div>
                <div class="form-group">
                  <label class="form-label required">Email Address (Registered)</label>
                  <input type="email" class="form-control bg-slate-50" [value]="profile.email" disabled />
                </div>
              </div>

              <div class="form-group mb-4">
                <label class="form-label required">Mobile Phone Number</label>
                <input type="tel" class="form-control font-mono" formControlName="mobileNumber" />
              </div>

              <button type="submit" class="btn btn-primary" [disabled]="profileForm.invalid || updatingProfile">
                {{ updatingProfile ? 'Saving Changes...' : 'Save Profile Changes' }}
              </button>
            </form>
          </div>

          <!-- Change Password Form -->
          <div class="card p-4">
            <h3 class="card-title mb-1">Change Security Password</h3>
            <p class="text-xs text-muted mb-4">Your password must be at least 8 characters and include uppercase, lowercase, numbers, and symbols</p>

            <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
              <div class="form-group mb-3">
                <label class="form-label required">Current Password</label>
                <div class="password-input-wrap">
                  <input
                    [type]="showOldPassword ? 'text' : 'password'"
                    class="form-control"
                    formControlName="currentPassword"
                  />
                  <button type="button" class="btn-toggle-eye" (click)="showOldPassword = !showOldPassword">
                    <span class="material-symbols-outlined">{{ showOldPassword ? 'visibility_off' : 'visibility' }}</span>
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3 mb-4">
                <div class="form-group">
                  <label class="form-label required">New Password</label>
                  <div class="password-input-wrap">
                    <input
                      [type]="showNewPassword ? 'text' : 'password'"
                      class="form-control"
                      formControlName="newPassword"
                    />
                    <button type="button" class="btn-toggle-eye" (click)="showNewPassword = !showNewPassword">
                      <span class="material-symbols-outlined">{{ showNewPassword ? 'visibility_off' : 'visibility' }}</span>
                    </button>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label required">Confirm New Password</label>
                  <input
                    type="password"
                    class="form-control"
                    formControlName="confirmPassword"
                  />
                </div>
              </div>

              <div class="form-error mb-3" *ngIf="passwordMismatch">
                New password and confirmation do not match
              </div>

              <button
                type="submit"
                class="btn btn-secondary"
                [disabled]="passwordForm.invalid || passwordMismatch || changingPassword"
              >
                {{ changingPassword ? 'Updating Password...' : 'Update Password' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-page {
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

    .profile-layout {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 24px;
      align-items: start;
    }

    .avatar-large {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1E293B, #0F172A);
      color: #FFFFFF;
      font-size: 1.6rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
    }

    .user-name {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--text-main);
      margin: 0;
    }

    .role-badge {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 700;
      background: #EFF6FF;
      color: #2563EB;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .meta-list {
      border-top: 1px solid var(--border);
      padding-top: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;

      .meta-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.82rem;
        .label { color: var(--text-muted); }
        .val { color: var(--text-main); }
      }
    }

    .security-card {
      background: #F8FAFC;
    }

    .security-list {
      margin: 0;
      padding-left: 18px;
      font-size: 0.78rem;
      color: var(--text-muted);
      line-height: 1.6;
    }

    .card-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-main);
      margin: 0;
    }

    .password-input-wrap {
      position: relative;
      display: flex;
      align-items: center;

      .btn-toggle-eye {
        position: absolute;
        right: 10px;
        background: none;
        border: none;
        cursor: pointer;
        color: var(--text-muted);
        display: flex;
        padding: 4px;
        &:hover { color: var(--text-main); }
        .material-symbols-outlined { font-size: 18px; }
      }
    }

    @media (max-width: 900px) {
      .profile-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class ProfileComponent implements OnInit {
  loading = true;
  updatingProfile = false;
  changingPassword = false;

  profile: UserProfile | null = null;
  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  showOldPassword = false;
  showNewPassword = false;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      mobileNumber: ['', [Validators.required, Validators.pattern(/^[0-9+ -]{8,15}$/)]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });

    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.userService.getProfile().subscribe({
      next: (data) => {
        this.profile = data;
        this.profileForm.patchValue({
          fullName: data.fullName,
          mobileNumber: data.mobile
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.error('Failed to load profile details.');
      }
    });
  }

  getInitials(name?: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }

  get passwordMismatch(): boolean {
    const p1 = this.passwordForm.value.newPassword;
    const p2 = this.passwordForm.value.confirmPassword;
    return !!(p1 && p2 && p1 !== p2);
  }

  updateProfile(): void {
    if (this.profileForm.invalid) return;
    this.updatingProfile = true;

    const req: UserUpdateRequest = {
      fullName: this.profileForm.value.fullName.trim(),
      mobile: this.profileForm.value.mobileNumber.trim()
    };

    this.userService.updateProfile(req).subscribe({
      next: (updated) => {
        this.updatingProfile = false;
        this.profile = updated;
        this.toastService.success('Profile contact details updated!');
      },
      error: (err) => {
        this.updatingProfile = false;
        this.toastService.error(err?.error?.message || 'Failed to update profile.');
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid || this.passwordMismatch) return;
    this.changingPassword = true;

    const req: ChangePasswordRequest = {
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword
    };

    this.userService.changePassword(req).subscribe({
      next: () => {
        this.changingPassword = false;
        this.passwordForm.reset();
        this.toastService.success('Password changed successfully!');
      },
      error: (err) => {
        this.changingPassword = false;
        this.toastService.error(err?.error?.message || 'Failed to update password. Check your current password.');
      }
    });
  }
}
