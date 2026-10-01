import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge badge-{{ statusClass }}">
      <span class="dot"></span>
      {{ label || status }}
    </span>
  `,
  styles: [`
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: currentColor;
    }
  `]
})
export class StatusBadgeComponent {
  @Input({ required: true }) status: string = '';
  @Input() label?: string;

  get statusClass(): string {
    return this.status ? this.status.toUpperCase() : 'PENDING';
  }
}
