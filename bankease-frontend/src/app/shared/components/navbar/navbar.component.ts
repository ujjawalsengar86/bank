import { Component, EventEmitter, HostListener, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { NotificationItem } from '../../../core/models/notification.model';
import { UserSummary } from '../../../core/models/auth.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="topbar">
      <div class="topbar-left">
        <button class="btn-toggle-menu" (click)="toggleSidebar.emit()">
          <span class="material-symbols-outlined">menu</span>
        </button>
        <a routerLink="/dashboard" class="brand">
          <div class="brand-icon">
            <span class="material-symbols-outlined">account_balance</span>
          </div>
          <span class="brand-text">Bank<span>Ease</span></span>
        </a>
      </div>

      <div class="topbar-right">
        <!-- Notification Dropdown -->
        <div class="dropdown-wrap notif-dropdown">
          <button class="icon-btn" (click)="toggleNotifDropdown()">
            <span class="material-symbols-outlined">notifications</span>
            <span *ngIf="unreadCount > 0" class="badge-count">{{ unreadCount }}</span>
          </button>

          <div class="dropdown-menu" *ngIf="showNotifDropdown" (click)="$event.stopPropagation()">
            <div class="dropdown-header">
              <h4>Notifications</h4>
              <button *ngIf="unreadCount > 0" class="text-btn" (click)="markAllRead()">Mark all read</button>
            </div>
            <div class="dropdown-body">
              <div *ngIf="notifications.length === 0" class="dropdown-empty">
                <p>No notifications yet</p>
              </div>
              <div
                *ngFor="let notif of notifications.slice(0, 4)"
                class="dropdown-item"
                [class.unread]="!notif.read"
                (click)="openNotif(notif)"
              >
                <div class="notif-dot" *ngIf="!notif.read"></div>
                <div class="notif-text">
                  <span class="title">{{ notif.title }}</span>
                  <span class="msg">{{ notif.message }}</span>
                </div>
              </div>
            </div>
            <div class="dropdown-footer">
              <a routerLink="/notifications" (click)="showNotifDropdown = false">View all notifications</a>
            </div>
          </div>
        </div>

        <!-- User Profile Pill & Dropdown -->
        <div class="dropdown-wrap user-dropdown" *ngIf="currentUser">
          <button class="user-pill" (click)="toggleUserDropdown()">
            <div class="avatar">
              {{ getUserInitials() }}
            </div>
            <div class="user-meta">
              <span class="name">{{ currentUser.fullName }}</span>
              <span class="role-tag">{{ currentUser.role }}</span>
            </div>
            <span class="material-symbols-outlined arrow">expand_more</span>
          </button>

          <div class="dropdown-menu user-menu" *ngIf="showUserDropdown" (click)="$event.stopPropagation()">
            <div class="user-info-header">
              <p class="u-name">{{ currentUser.fullName }}</p>
              <p class="u-email">{{ currentUser.email }}</p>
            </div>
            <div class="menu-items">
              <a routerLink="/profile" class="menu-item" (click)="showUserDropdown = false">
                <span class="material-symbols-outlined">account_circle</span>
                My Profile
              </a>
              <a routerLink="/notifications" class="menu-item" (click)="showUserDropdown = false">
                <span class="material-symbols-outlined">notifications</span>
                Notifications
              </a>
              <div class="divider"></div>
              <button class="menu-item logout-btn" (click)="logout()">
                <span class="material-symbols-outlined">logout</span>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .topbar {
      height: 64px;
      background: var(--bg-card);
      border-bottom: 1px solid var(--border);
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .btn-toggle-menu {
      display: none;
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 6px;
      border-radius: var(--radius-sm);
      &:hover { background: var(--bg-hover); color: var(--text-main); }
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;

      .brand-icon {
        width: 38px;
        height: 38px;
        background: linear-gradient(135deg, #0F172A 0%, #1E3E62 100%);
        color: #FFFFFF;
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 5px rgba(15, 23, 42, 0.2);

        .material-symbols-outlined {
          font-size: 22px;
        }
      }

      .brand-text {
        font-size: 1.25rem;
        font-weight: 800;
        color: var(--primary);
        letter-spacing: -0.02em;

        span {
          color: var(--primary-accent);
        }
      }
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .dropdown-wrap {
      position: relative;
    }

    .icon-btn {
      position: relative;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--bg-hover);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        color: var(--text-main);
        background: #E2E8F0;
      }

      .badge-count {
        position: absolute;
        top: -3px;
        right: -3px;
        background: var(--rose);
        color: #FFFFFF;
        font-size: 0.68rem;
        font-weight: 700;
        min-width: 18px;
        height: 18px;
        padding: 0 4px;
        border-radius: 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #FFFFFF;
      }
    }

    .user-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--bg-hover);
      border: 1px solid var(--border);
      padding: 5px 12px 5px 6px;
      border-radius: var(--radius-full);
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: #E2E8F0;
      }

      .avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--primary-accent);
        color: #FFFFFF;
        font-size: 0.8125rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .user-meta {
        display: flex;
        flex-direction: column;
        text-align: left;

        .name {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--text-main);
          line-height: 1.2;
        }

        .role-tag {
          font-size: 0.65rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
        }
      }

      .arrow {
        color: var(--text-muted);
        font-size: 18px;
      }
    }

    .dropdown-menu {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 320px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      overflow: hidden;
      z-index: 200;
      animation: menuFade 0.18s ease-out;

      .dropdown-header {
        padding: 12px 16px;
        border-bottom: 1px solid var(--border);
        display: flex;
        justify-content: space-between;
        align-items: center;

        h4 {
          font-size: 0.875rem;
          margin: 0;
        }

        .text-btn {
          background: none;
          border: none;
          color: var(--primary-accent);
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          &:hover { text-decoration: underline; }
        }
      }

      .dropdown-body {
        max-height: 280px;
        overflow-y: auto;

        .dropdown-empty {
          padding: 24px;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.8125rem;
        }

        .dropdown-item {
          padding: 10px 14px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          border-bottom: 1px solid var(--border);
          cursor: pointer;
          transition: background-color 0.12s ease;

          &:hover { background: var(--bg-hover); }
          &.unread { background: #F0FDF4; }

          .notif-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: var(--emerald);
            margin-top: 5px;
          }

          .notif-text {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 2px;

            .title {
              font-size: 0.8125rem;
              font-weight: 600;
              color: var(--text-main);
            }
            .msg {
              font-size: 0.75rem;
              color: var(--text-muted);
              line-height: 1.3;
            }
          }
        }
      }

      .dropdown-footer {
        padding: 10px;
        background: var(--bg-main);
        text-align: center;
        border-top: 1px solid var(--border);

        a {
          font-size: 0.8125rem;
          font-weight: 600;
        }
      }
    }

    .user-menu {
      width: 230px;

      .user-info-header {
        padding: 14px 16px;
        border-bottom: 1px solid var(--border);
        background: var(--bg-hover);

        .u-name {
          font-weight: 700;
          font-size: 0.875rem;
          color: var(--text-main);
          margin: 0;
        }
        .u-email {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin: 0;
        }
      }

      .menu-items {
        padding: 6px;

        .menu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          font-size: 0.8125rem;
          color: var(--text-main);
          text-decoration: none;
          background: none;
          border: none;
          width: 100%;
          cursor: pointer;
          font-weight: 500;
          text-align: left;

          &:hover {
            background: var(--bg-hover);
          }

          .material-symbols-outlined {
            font-size: 18px;
            color: var(--text-muted);
          }

          &.logout-btn {
            color: var(--rose);
            .material-symbols-outlined { color: var(--rose); }
            &:hover { background: var(--rose-light); }
          }
        }

        .divider {
          height: 1px;
          background: var(--border);
          margin: 6px 0;
        }
      }
    }

    @keyframes menuFade {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 900px) {
      .btn-toggle-menu {
        display: flex;
      }
      .user-meta {
        display: none !important;
      }
    }
  `]
})
export class NavbarComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();

  currentUser: UserSummary | null = null;
  notifications: NotificationItem[] = [];
  unreadCount = 0;
  showNotifDropdown = false;
  showUserDropdown = false;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.notificationService.notifications$.subscribe(items => {
      this.notifications = items;
      this.unreadCount = items.filter(n => !n.read).length;
    });

    if (this.authService.isAuthenticated()) {
      this.notificationService.getNotifications().subscribe();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-wrap')) {
      this.showNotifDropdown = false;
      this.showUserDropdown = false;
    }
  }

  toggleNotifDropdown(): void {
    this.showNotifDropdown = !this.showNotifDropdown;
    this.showUserDropdown = false;
  }

  toggleUserDropdown(): void {
    this.showUserDropdown = !this.showUserDropdown;
    this.showNotifDropdown = false;
  }

  markAllRead(): void {
    this.notificationService.markAllAsRead().subscribe();
  }

  openNotif(notif: NotificationItem): void {
    if (!notif.read) {
      this.notificationService.markAsRead(notif.id).subscribe();
    }
    this.showNotifDropdown = false;
  }

  logout(): void {
    this.showUserDropdown = false;
    this.authService.logout();
  }

  getUserInitials(): string {
    if (!this.currentUser?.fullName) return 'U';
    const parts = this.currentUser.fullName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }
}
