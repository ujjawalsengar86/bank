import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-wrapper" *ngIf="(toastService.toasts$ | async) as toasts">
      <div
        *ngFor="let toast of toasts"
        class="toast-item toast-{{ toast.type }}"
        (click)="toastService.remove(toast.id)"
      >
        <span class="material-symbols-outlined icon">
          {{ getIcon(toast.type) }}
        </span>
        <div class="toast-content">
          {{ toast.message }}
        </div>
        <button class="toast-close" (click)="toastService.remove(toast.id)">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-wrapper {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
      pointer-events: none;
    }

    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #FFFFFF;
      border-radius: var(--radius-md);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      border-left: 4px solid #64748B;
      cursor: pointer;
      animation: slideInRight 0.25s ease-out;
      font-size: 0.875rem;
      color: #0F172A;

      &.toast-success {
        border-left-color: #059669;
        .icon { color: #059669; }
      }

      &.toast-error {
        border-left-color: #E11D48;
        .icon { color: #E11D48; }
      }

      &.toast-warning {
        border-left-color: #D97706;
        .icon { color: #D97706; }
      }

      &.toast-info {
        border-left-color: #2563EB;
        .icon { color: #2563EB; }
      }

      .toast-content {
        flex: 1;
        font-weight: 500;
        line-height: 1.4;
      }

      .toast-close {
        background: none;
        border: none;
        cursor: pointer;
        color: #94A3B8;
        padding: 2px;
        display: flex;
        &:hover { color: #0F172A; }
        .material-symbols-outlined { font-size: 18px; }
      }
    }

    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(30px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `]
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}

  getIcon(type: string): string {
    switch (type) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  }
}
