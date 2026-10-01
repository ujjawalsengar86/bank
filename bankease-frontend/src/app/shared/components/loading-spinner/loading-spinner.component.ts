import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner-container" [class.overlay]="overlay">
      <div class="spinner" [style.width.px]="size" [style.height.px]="size"></div>
      <p *ngIf="message" class="spinner-message">{{ message }}</p>
    </div>
  `,
  styles: [`
    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
      gap: 12px;

      &.overlay {
        position: absolute;
        inset: 0;
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(2px);
        z-index: 20;
      }
    }

    .spinner {
      border: 3px solid #E2E8F0;
      border-top-color: var(--primary-accent);
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
    }

    .spinner-message {
      font-size: 0.875rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() size: number = 36;
  @Input() message?: string;
  @Input() overlay: boolean = false;
}
