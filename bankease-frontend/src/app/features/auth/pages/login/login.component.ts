import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ToastComponent } from '../../../../shared/components/toast/toast.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ToastComponent],
  template: `
    <app-toast></app-toast>
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <div class="brand-logo">
            <span class="material-symbols-outlined icon">account_balance</span>
          </div>
          <h2>Welcome to BankEase</h2>
          <p class="subtitle">Next-Generation Secure Net Banking Platform</p>
        </div>

        <!-- Quick Demo Access Banner -->
        <div class="demo-access-box">
          <div class="demo-title">
            <span class="material-symbols-outlined">badge</span>
            <span>Instant Demo Access</span>
          </div>
          <div class="demo-chips">
            <button type="button" class="chip-btn" (click)="fillDemo('CUSTOMER')" title="Sign in as Customer">
              <span class="material-symbols-outlined icon">person</span>
              <span>Customer</span>
            </button>
            <button type="button" class="chip-btn" (click)="fillDemo('BANK_OFFICER')" title="Sign in as Loan Officer">
              <span class="material-symbols-outlined icon">rate_review</span>
              <span>Loan Officer</span>
            </button>
            <button type="button" class="chip-btn" (click)="fillDemo('ADMIN')" title="Sign in as Admin">
              <span class="material-symbols-outlined icon">admin_panel_settings</span>
              <span>Admin</span>
            </button>
          </div>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label class="form-label" for="email">Email Address</label>
            <div class="input-with-icon">
              <span class="material-symbols-outlined icon-prefix">mail</span>
              <input
                id="email"
                type="email"
                class="form-control"
                formControlName="email"
                placeholder="name@example.com"
                [class.is-invalid]="f['email'].touched && f['email'].invalid"
              />
            </div>
            <div class="invalid-feedback" *ngIf="f['email'].touched && f['email'].invalid">
              <span *ngIf="f['email'].errors?.['required']">Email address is required</span>
              <span *ngIf="f['email'].errors?.['email']">Please enter a valid email address</span>
            </div>
          </div>

          <div class="form-group">
            <div class="label-row">
              <label class="form-label" for="password">Password</label>
            </div>
            <div class="input-with-icon">
              <span class="material-symbols-outlined icon-prefix">lock</span>
              <input
                id="password"
                [type]="showPassword ? 'text' : 'password'"
                class="form-control"
                formControlName="password"
                placeholder="Enter account password"
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
              Password is required
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading || loginForm.invalid">
            <span *ngIf="loading" class="material-symbols-outlined spin">progress_activity</span>
            <span>{{ loading ? 'Signing In...' : 'Sign In to Account' }}</span>
          </button>
        </form>

        <div class="auth-footer">
          <p>Don't have an account? <a routerLink="/register">Register new account</a></p>
          <div class="security-banner">
            <span class="material-symbols-outlined">lock_clock</span>
            <span>Protected by 256-bit TLS encryption & multi-factor session security</span>
          </div>
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
      padding: 24px;
    }

    .auth-card {
      background: #FFFFFF;
      border-radius: var(--radius-lg);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
      width: 100%;
      max-width: 460px;
      padding: 38px;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 28px;

      .brand-logo {
        width: 52px;
        height: 52px;
        background: var(--primary);
        color: #FFFFFF;
        border-radius: var(--radius-md);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 14px;
        box-shadow: 0 4px 10px rgba(15, 23, 42, 0.25);

        .icon {
          font-size: 30px;
        }
      }

      h2 {
        font-size: 1.5rem;
        color: var(--primary);
        margin-bottom: 4px;
      }

      .subtitle {
        font-size: 0.84rem;
        color: var(--text-muted);
      }
    }

    .label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .btn-block {
      width: 100%;
      padding: 12px;
      font-size: 0.95rem;
      margin-top: 6px;
    }

    .auth-footer {
      margin-top: 24px;
      text-align: center;
      font-size: 0.85rem;
      color: var(--text-muted);

      .security-banner {
        margin-top: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        font-size: 0.72rem;
        color: var(--emerald-dark);
        background: var(--emerald-light);
        padding: 8px 12px;
        border-radius: var(--radius-sm);

        .material-symbols-outlined {
          font-size: 16px;
        }
      }
    }

    .demo-access-box {
      background: #F8FAFC;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 12px 14px;
      margin-bottom: 20px;

      .demo-title {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.76rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--primary-accent);
        margin-bottom: 8px;

        .material-symbols-outlined {
          font-size: 16px;
        }
      }

      .demo-chips {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;

        .chip-btn {
          flex: 1;
          min-width: 90px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 7px 10px;
          background: #FFFFFF;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-main);
          cursor: pointer;
          transition: all 0.15s ease;

          .icon {
            font-size: 16px;
            color: var(--primary-accent);
          }

          &:hover {
            background: #EFF6FF;
            border-color: #93C5FD;
            color: var(--primary-accent);
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1);
          }
        }
      }
    }

    .spin {
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  showPassword = false;
  returnUrl = '/dashboard';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      const defaultRoute = this.authService.getDefaultRoute();
      this.router.navigate([defaultRoute]);
      return;
    }

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || this.authService.getDefaultRoute();

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  fillDemo(role: 'CUSTOMER' | 'BANK_OFFICER' | 'ADMIN'): void {
    if (role === 'CUSTOMER') {
      this.loginForm.patchValue({
        email: 'customer@bankease.com',
        password: 'Customer@123'
      });
    } else if (role === 'BANK_OFFICER') {
      this.loginForm.patchValue({
        email: 'officer@bankease.com',
        password: 'Officer@123'
      });
    } else if (role === 'ADMIN') {
      this.loginForm.patchValue({
        email: 'admin@bankease.com',
        password: 'Admin@123'
      });
    }
    this.onSubmit();
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.loading = false;
        this.toastService.success(`Welcome back, ${res.user.fullName}!`);

        if (this.returnUrl && this.returnUrl !== '/dashboard' && this.returnUrl !== '/' && this.returnUrl !== this.authService.getDefaultRoute()) {
          this.router.navigateByUrl(this.returnUrl);
        } else if (res.user.role === 'ADMIN') {
          this.router.navigate(['/admin']);
        } else if (res.user.role === 'BANK_OFFICER') {
          this.router.navigate(['/loans']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.message || 'Invalid email or password. Please verify credentials.';
        this.toastService.error(msg);
      }
    });
  }
}
