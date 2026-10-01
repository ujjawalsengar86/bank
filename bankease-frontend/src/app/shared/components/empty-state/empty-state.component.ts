import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state">
      <div class="icon-wrap">
        <span class="material-symbols-outlined">{{ icon }}</span>
      </div>
      <h3>{{ title }}</h3>
      <p *ngIf="description">{{ description }}</p>
      <button *ngIf="actionLabel" class="btn btn-primary btn-sm" (click)="action.emit()">
        {{ actionLabel }}
      </button>
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 48px 24px;
      gap: 12px;
      background: var(--bg-card);
      border-radius: var(--radius-md);
      border: 1px dashed var(--border);
    }

    .icon-wrap {
      width: 54px;
      height: 54px;
      border-radius: 50%;
      background: var(--bg-hover);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--secondary);

      .material-symbols-outlined {
        font-size: 28px;
      }
    }

    h3 {
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--text-main);
      margin: 0;
    }

    p {
      font-size: 0.875rem;
      color: var(--text-muted);
      max-width: 380px;
      margin: 0;
    }

    button {
      margin-top: 6px;
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon: string = 'inbox';
  @Input({ required: true }) title: string = '';
  @Input() description?: string;
  @Input() actionLabel?: string;
  @Output() action = new EventEmitter<void>();
}
