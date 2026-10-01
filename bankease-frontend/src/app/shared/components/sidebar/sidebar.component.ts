import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole, UserSummary } from '../../../core/models/auth.model';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles?: UserRole[];
  badge?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar" [class.mobile-open]="isOpen">
      <div class="sidebar-header-mobile">
        <span class="logo-title">BankEase Navigation</span>
        <button class="btn-close" (click)="closeSidebar.emit()">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <nav class="sidebar-nav">
        <!-- Main Banking Section -->
        <div class="nav-section-title">BANKING</div>
        <ul class="nav-list">
          <li *ngFor="let item of bankingNavItems">
            <a
              [routerLink]="item.path"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: item.path === '/dashboard' || item.path === '/admin' }"
              (click)="onNavClick()"
              class="nav-link"
            >
              <span class="material-symbols-outlined icon">{{ item.icon }}</span>
              <span class="label">{{ item.label }}</span>
              <span *ngIf="item.badge" class="badge-mini">{{ item.badge }}</span>
            </a>
          </li>
        </ul>

        <!-- Officer / Admin Section -->
        <ng-container *ngIf="officerOrAdminItems.length > 0">
          <div class="nav-section-title">MANAGEMENT</div>
          <ul class="nav-list">
            <li *ngFor="let item of officerOrAdminItems">
              <a
                [routerLink]="item.path"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: item.path === '/admin' }"
                (click)="onNavClick()"
                class="nav-link"
              >
                <span class="material-symbols-outlined icon">{{ item.icon }}</span>
                <span class="label">{{ item.label }}</span>
                <span *ngIf="item.badge" class="badge-mini badge-alert">{{ item.badge }}</span>
              </a>
            </li>
          </ul>
        </ng-container>

        <!-- Account & Preferences Section -->
        <div class="nav-section-title">ACCOUNT</div>
        <ul class="nav-list">
          <li *ngFor="let item of accountNavItems">
            <a
              [routerLink]="item.path"
              routerLinkActive="active"
              (click)="onNavClick()"
              class="nav-link"
            >
              <span class="material-symbols-outlined icon">{{ item.icon }}</span>
              <span class="label">{{ item.label }}</span>
            </a>
          </li>
          <li>
            <button class="nav-link btn-signout" (click)="logout()">
              <span class="material-symbols-outlined icon">logout</span>
              <span class="label">Sign Out</span>
            </button>
          </li>
        </ul>
      </nav>

      <!-- Live Role Pill Footer -->
      <div class="sidebar-footer" *ngIf="currentUser">
        <div class="status-indicator">
          <span class="status-dot"></span>
          <div class="status-info">
            <span class="status-label">Access Mode</span>
            <span class="status-role">{{ currentUser.role }}</span>
          </div>
        </div>
      </div>
    </aside>
    <div class="sidebar-backdrop" *ngIf="isOpen" (click)="closeSidebar.emit()"></div>
  `,
  styles: [`
    .sidebar {
      width: 240px;
      height: calc(100vh - 64px);
      background: var(--bg-card);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 64px;
      overflow-y: auto;
      z-index: 90;
      transition: transform 0.2s ease-in-out;
    }

    .sidebar-header-mobile {
      display: none;
      padding: 16px;
      border-bottom: 1px solid var(--border);
      justify-content: space-between;
      align-items: center;

      .logo-title {
        font-weight: 700;
        font-size: 0.95rem;
        color: var(--primary);
      }
      .btn-close {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--text-muted);
      }
    }

    .sidebar-nav {
      padding: 16px 12px;
      flex: 1;
    }

    .nav-section-title {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      padding: 10px 12px 6px;
      text-transform: uppercase;
    }

    .nav-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-bottom: 12px;

      li {
        width: 100%;
      }
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 9px 12px;
      border-radius: var(--radius-sm);
      color: var(--text-muted);
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.15s ease;
      width: 100%;
      border: none;
      background: none;
      cursor: pointer;
      text-align: left;

      .icon {
        font-size: 20px;
        color: var(--secondary);
        transition: color 0.15s ease;
      }

      .label {
        flex: 1;
      }

      .badge-mini {
        font-size: 0.65rem;
        font-weight: 700;
        background: var(--blue-light);
        color: var(--blue);
        padding: 2px 6px;
        border-radius: var(--radius-full);

        &.badge-alert {
          background: #EDE9FE;
          color: #6D28D9;
        }
      }

      &:hover {
        background-color: var(--bg-hover);
        color: var(--text-main);

        .icon {
          color: var(--primary-accent);
        }
      }

      &.active {
        background-color: #EFF6FF;
        color: var(--primary-accent);
        font-weight: 600;

        .icon {
          color: var(--primary-accent);
        }
      }

      &.btn-signout {
        color: var(--rose);
        .icon { color: var(--rose); }
        &:hover {
          background-color: var(--rose-light);
        }
      }
    }

    .sidebar-footer {
      padding: 14px 16px;
      border-top: 1px solid var(--border);
      background: var(--bg-main);

      .status-indicator {
        display: flex;
        align-items: center;
        gap: 10px;

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--emerald);
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
        }

        .status-info {
          display: flex;
          flex-direction: column;

          .status-label {
            font-size: 0.65rem;
            color: var(--text-muted);
            text-transform: uppercase;
            font-weight: 600;
          }

          .status-role {
            font-size: 0.78rem;
            font-weight: 700;
            color: var(--text-main);
          }
        }
      }
    }

    .sidebar-backdrop {
      display: none;
    }

    @media (max-width: 900px) {
      .sidebar {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        height: 100vh;
        z-index: 1000;
        transform: translateX(-100%);
        box-shadow: var(--shadow-xl);

        &.mobile-open {
          transform: translateX(0);
        }
      }

      .sidebar-header-mobile {
        display: flex;
      }

      .sidebar-backdrop {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.5);
        backdrop-filter: blur(2px);
        z-index: 999;
      }
    }
  `]
})
export class SidebarComponent implements OnInit {
  @Input() isOpen = false;
  @Output() closeSidebar = new EventEmitter<void>();

  currentUser: UserSummary | null = null;

  allBankingItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'Accounts', path: '/accounts', icon: 'account_balance_wallet' },
    { label: 'Transfer Money', path: '/transfers', icon: 'swap_horiz', roles: ['CUSTOMER'] },
    { label: 'Beneficiaries', path: '/beneficiaries', icon: 'group', roles: ['CUSTOMER'] },
    { label: 'Pay Bills', path: '/bills', icon: 'receipt_long', roles: ['CUSTOMER'] },
    { label: 'Loans & EMI', path: '/loans', icon: 'real_estate_agent' },
    { label: 'Investments', path: '/investments', icon: 'trending_up', roles: ['CUSTOMER'] },
    { label: 'Transactions', path: '/transactions', icon: 'list_alt' }
  ];

  accountNavItems: NavItem[] = [
    { label: 'Notifications', path: '/notifications', icon: 'notifications' },
    { label: 'Profile & Security', path: '/profile', icon: 'person' }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  get bankingNavItems(): NavItem[] {
    if (!this.currentUser) return [];
    return this.allBankingItems.filter(item => {
      if (!item.roles) return true;
      return item.roles.includes(this.currentUser!.role);
    });
  }

  get officerOrAdminItems(): NavItem[] {
    if (!this.currentUser) return [];
    const items: NavItem[] = [];

    if (this.currentUser.role === 'BANK_OFFICER') {
      items.push({
        label: 'Loan Review',
        path: '/loans',
        icon: 'rate_review',
        badge: 'Officer'
      });
    }

    if (this.currentUser.role === 'ADMIN') {
      items.push(
        { label: 'Admin Overview', path: '/admin', icon: 'admin_panel_settings', badge: 'Admin' },
        { label: 'User Directory', path: '/admin/users', icon: 'manage_accounts' },
        { label: 'System Accounts', path: '/admin/accounts', icon: 'account_balance' },
        { label: 'Audit Trail', path: '/admin/audit-logs', icon: 'history_toggle_off' }
      );
    }

    return items;
  }

  onNavClick(): void {
    if (window.innerWidth <= 900) {
      this.closeSidebar.emit();
    }
  }

  logout(): void {
    this.closeSidebar.emit();
    this.authService.logout();
  }
}
