import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ToastComponent } from '../../../../shared/components/toast/toast.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ToastComponent],
  template: `
    <app-toast></app-toast>
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <div class="brand-logo">
            <span class="material-symbols-outlined icon">person_add</span>
          </div>
          <h2>Open a BankEase Account</h2>
          <p class="subtitle">Experience frictionless digital banking in minutes</p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label class="form-label" for="fullName">Full Legal Name</label>
            <div class="input-with-icon">
              <span class="material-symbols-outlined icon-prefix">person</span>
              <input
                id="fullName"
                type="text"
                class="form-control"
                formControlName="fullName"
                placeholder="e.g. Alexander Smith"
                [class.is-invalid]="f['fullName'].touched && f['fullName'].invalid"
              />
            </div>
            <div class="invalid-feedback" *ngIf="f['fullName'].touched && f['fullName'].invalid">
              Full legal name is required (min 2 characters)
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Email Address</label>
            <div class="input-with-icon">
              <span class="material-symbols-outlined icon-prefix">mail</span>
              <input
                id="email"
                type="email"
                class="form-control"
                formControlName="email"
                placeholder="alexander@example.com"
                [class.is-invalid]="f['email'].touched && f['email'].invalid"
              />
            </div>
            <div class="invalid-feedback" *ngIf="f['email'].touched && f['email'].invalid">
              <span *ngIf="f['email'].errors?.['required']">Email address is required</span>
              <span *ngIf="f['email'].errors?.['email']">Please enter a valid email address</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="mobile">Mobile Number (10 Digits)</label>
            <div class="input-with-icon">
              <span class="material-symbols-outlined icon-prefix">phone_iphone</span>
              <input
                id="mobile"
                type="tel"
                class="form-control"
                formControlName="mobile"
                placeholder="9876543210"
                [class.is-invalid]="f['mobile'].touched && f['mobile'].invalid"
              />
            </div>
            <div class="invalid-feedback" *ngIf="f['mobile'].touched && f['mobile'].invalid">
              Please enter a valid 10-15 digit mobile number
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Create Secure Password</label>
            <div class="input-with-icon">
              <span class="material-symbols-outlined icon-prefix">lock</span>
              <input
                id="password"
                [type]="showPassword ? 'text' : 'password'"
                class="form-control"
                formControlName="password"
                placeholder="At least 6 characters"
                [class.is-invalid]="f['password'].touched && f['password'].invalid"
              />
              <button
                type="button"
                class="btn-toggle-visibility"
                (click)="showPassword = !showPassword"
                tabindex="-1"
              >
                <span class="material-symbols-outlined">
                  {{ showPassword ? 'visibility_off' : 'visibility' }}
                </span>
              </button>
            </div>
            <div class="invalid-feedback" *ngIf="f['password'].touched && f['password'].invalid">
              Password must be at least 6 characters
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="confirmPassword">Confirm Password</label>
            <div class="input-with-icon">
              <span class="material-symbols-outlined icon-prefix">lock_reset</span>
              <input
                id="confirmPassword"
                type="password"
                class="form-control"
                formControlName="confirmPassword"
                placeholder="Re-enter password"
                [class.is-invalid]="registerForm.errors?.['passwordMismatch'] && f['confirmPassword'].touched"
              />
            </div>
            <div class="invalid-feedback" *ngIf="registerForm.errors?.['passwordMismatch'] && f['confirmPassword'].touched">
              Passwords do not match
            </div>
          </div>

          <div class="opening-bonus-card">
            <span class="material-symbols-outlined icon">savings</span>
            <div class="text">
              <strong>Instant Welcome Gift</strong>
              <span>A verified savings account with ₹10,000 opening test balance will be created automatically.</span>
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading || registerForm.invalid">
            <span *ngIf="loading" class="material-symbols-outlined spin">progress_activity</span>
            <span>{{ loading ? 'Creating Account...' : 'Complete Registration' }}</span>
          </button>
        </form>

        <div class="auth-footer">
          <p>Already have an account? <a routerLink="/login">Sign in</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0B132B 100%);
      padding: 30px 16px;
    }

    .auth-card {
      background: #FFFFFF;
      border-radius: var(--radius-lg);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
      width: 100%;
      max-width: 490px;
      padding: 36px;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 24px;

      .brand-logo {
        width: 48px;
        height: 48px;
        background: var(--primary-accent);
        color: #FFFFFF;
        border-radius: var(--radius-md);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12px;

        .icon {
          font-size: 26px;
        }
      }

      h2 {
        font-size: 1.4rem;
        color: var(--primary);
        margin-bottom: 4px;
      }

      .subtitle {
        font-size: 0.84rem;
        color: var(--text-muted);
      }
    }

    .opening-bonus-card {
      display: flex;
      gap: 12px;
      background: var(--emerald-light);
      border: 1px solid #A7F3D0;
      border-radius: var(--radius-sm);
      padding: 12px;
      margin-bottom: 20px;
      color: var(--emerald-dark);

      .icon {
        font-size: 24px;
        color: var(--emerald);
      }

      .text {
        font-size: 0.78rem;
        display: flex;
        flex-direction: column;
        line-height: 1.35;

        strong {
          font-weight: 700;
          margin-bottom: 2px;
        }
      }
    }

    .btn-block {
      width: 100%;
      padding: 12px;
      font-size: 0.95rem;
    }

    .auth-footer {
      margin-top: 20px;
      text-align: center;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .spin {
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10,15}$')]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  get f() {
    return this.registerForm.controls;
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirm = control.get('confirmPassword')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const { fullName, email, mobile, password } = this.registerForm.value;

    this.authService.register({ fullName, email, mobile, password }).subscribe({
      next: () => {
        this.loading = false;
        this.toastService.success('Registration successful! Please sign in with your credentials.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.message || 'Registration failed. Email or mobile may already be in use.';
        this.toastService.error(msg);
      }
    });
  }
}
