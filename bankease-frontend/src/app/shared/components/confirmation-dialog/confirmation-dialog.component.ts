import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="onBackdropClick($event)">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ title }}</h3>
          <button class="btn-close" (click)="cancel.emit()">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="modal-body">
          <p class="dialog-message">{{ message }}</p>
          <ng-content></ng-content>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" (click)="cancel.emit()">{{ cancelLabel }}</button>
          <button type="button" class="btn" [ngClass]="confirmButtonClass" (click)="confirm.emit()">
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-message {
      font-size: 0.95rem;
      color: var(--text-muted);
      line-height: 1.5;
      margin: 0;
    }
  `]
})
export class ConfirmationDialogComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = 'Confirm Action';
  @Input() message: string = 'Are you sure you want to proceed?';
  @Input() confirmLabel: string = 'Confirm';
  @Input() cancelLabel: string = 'Cancel';
  @Input() confirmButtonClass: string = 'btn-primary';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onBackdropClick(event: MouseEvent): void {
    this.cancel.emit();
  }
}
