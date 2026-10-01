import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';
import { NotificationItem } from '../../core/models/notification.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-notifications',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="notifications-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Notification Center</h1>
          <p class="page-subtitle">Security alerts, transaction notices, and account advisories</p>
        </div>
        <div class="header-actions">
          <button
            class="btn btn-secondary"
            (click)="markAllAsRead()"
            [disabled]="unreadCount === 0 || markingAll"
          >
            <span class="material-symbols-outlined">done_all</span>
            Mark All as Read
          </button>
          <button class="btn btn-ghost" (click)="loadNotifications()">
            <span class="material-symbols-outlined">refresh</span>
          </button>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="filter-tabs">
        <button
          class="tab-btn"
          [class.active]="filter === 'ALL'"
          (click)="filter = 'ALL'"
        >
          All ({{ notifications.length }})
        </button>
        <button
          class="tab-btn"
          [class.active]="filter === 'UNREAD'"
          (click)="filter = 'UNREAD'"
        >
          Unread ({{ unreadCount }})
        </button>
      </div>

      <!-- Loading State -->
      <app-loading-spinner *ngIf="loading" message="Loading notifications..."></app-loading-spinner>

      <!-- Empty State -->
      <div *ngIf="!loading && displayedNotifications.length === 0">
        <app-empty-state
          icon="notifications_off"
          title="No Notifications"
          description="You are completely caught up! We will alert you whenever there are new ledger or security events."
        ></app-empty-state>
      </div>

      <!-- Notifications List -->
      <div class="notifications-list" *ngIf="!loading && displayedNotifications.length > 0">
        <div
          *ngFor="let item of displayedNotifications; trackBy: trackNotification"
          class="notification-card"
          [class.unread]="!item.read"
        >
          <div class="notif-icon" [ngClass]="getIconClass(item.type)">
            <span class="material-symbols-outlined">{{ getIcon(item.type) }}</span>
          </div>

          <div class="notif-content">
            <div class="notif-head">
              <h4 class="title">{{ item.title }}</h4>
              <span class="date">{{ item.createdAt | date:'medium' }}</span>
            </div>
            <p class="message">{{ item.message }}</p>
          </div>

          <div class="notif-action" *ngIf="!item.read">
            <button class="btn btn-ghost btn-sm" (click)="markAsRead(item.id)" title="Mark as read">
              <span class="material-symbols-outlined">check</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notifications-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
      max-width: 900px;
      margin: 0 auto;
      width: 100%;
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
        margin: 0;
      }
      .page-subtitle {
        font-size: 0.9rem;
        color: var(--text-muted);
        margin: 4px 0 0 0;
      }
      .header-actions { display: flex; gap: 8px; align-items: center; }
    }

    .filter-tabs {
      display: flex;
      gap: 8px;
      border-bottom: 2px solid var(--border);

      .tab-btn {
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        padding: 8px 16px;
        font-size: 0.88rem;
        font-weight: 600;
        color: var(--text-muted);
        cursor: pointer;

        &.active {
          color: var(--primary-accent);
          border-bottom-color: var(--primary-accent);
        }
      }
    }

    .notifications-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .notification-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 16px 20px;
      display: flex;
      align-items: flex-start;
      gap: 16px;
      transition: all 0.15s ease;

      &.unread {
        background: #F8FAFC;
        border-left: 4px solid var(--primary-accent);
      }

      .notif-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        &.icon-info { background: #EFF6FF; color: #2563EB; }
        &.icon-success { background: #ECFDF5; color: #059669; }
        &.icon-warning { background: #FFFBEB; color: #D97706; }
        &.icon-alert { background: #FFF1F2; color: #E11D48; }

        .material-symbols-outlined { font-size: 22px; }
      }

      .notif-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;

        .notif-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 10px;

          .title {
            font-size: 0.95rem;
            font-weight: 600;
            color: var(--text-main);
            margin: 0;
          }

          .date {
            font-size: 0.75rem;
            color: var(--text-muted);
          }
        }

        .message {
          font-size: 0.85rem;
          color: #475569;
          line-height: 1.4;
          margin: 0;
        }
      }
    }
  `]
})
export class NotificationsComponent implements OnInit {
  loading = true;
  markingAll = false;
  filter: 'ALL' | 'UNREAD' = 'ALL';

  notifications: NotificationItem[] = [];

  constructor(
    private notificationService: NotificationService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  trackNotification = (_: number, item: NotificationItem) => item.id;

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading = true;
    this.notificationService.getNotifications().subscribe({
      next: (data) => {
        this.notifications = data || [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
        this.toastService.error('Failed to load notifications.');
      }
    });
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  get displayedNotifications(): NotificationItem[] {
    if (this.filter === 'UNREAD') {
      return this.notifications.filter(n => !n.read);
    }
    return this.notifications;
  }

  markAsRead(id: number): void {
    this.notificationService.markAsRead(id).subscribe({
      next: () => {
        const item = this.notifications.find(n => n.id === id);
        if (item) item.read = true;
      }
    });
  }

  markAllAsRead(): void {
    this.markingAll = true;
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.markingAll = false;
        this.notifications.forEach(n => n.read = true);
        this.toastService.success('All notifications marked as read.');
      },
      error: () => {
        this.markingAll = false;
        this.toastService.error('Failed to update notifications.');
      }
    });
  }

  getIcon(type: string): string {
    switch (type?.toUpperCase()) {
      case 'TRANSACTION': return 'payments';
      case 'SECURITY': return 'shield';
      case 'LOAN': return 'account_balance';
      case 'ALERT': return 'warning';
      default: return 'notifications';
    }
  }

  getIconClass(type: string): string {
    switch (type?.toUpperCase()) {
      case 'TRANSACTION': return 'icon-success';
      case 'SECURITY': return 'icon-alert';
      case 'ALERT': return 'icon-warning';
      default: return 'icon-info';
    }
  }
}
