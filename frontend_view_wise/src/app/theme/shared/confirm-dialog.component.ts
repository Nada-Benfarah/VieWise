import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay-2" *ngIf="vm.open" (click)="svc.cancel()"></div>

    <div class="modal-content large" *ngIf="vm.open" (click)="$event.stopPropagation()">
      <h3 [style.color]="vm.danger ? '#b91c1c' : '#111827'">
        {{ vm.title }}
      </h3>

      <ng-container *ngIf="!vm.html; else htmlTpl">
        <p>{{ vm.message }}</p>

        <ng-container *ngIf="showInput">
          <input
            type="text"
            class="modal-input"
            [class.danger]="showInput && !inputValue.trim()"
            [placeholder]="vm.inputPlaceholder"
            [(ngModel)]="inputValue"
            [attr.aria-label]="vm.inputPlaceholder || 'Valeur de confirmation'"
            [attr.aria-invalid]="showInput && !inputValue.trim() ? true : null"
            autofocus
            (keyup.enter)="onConfirm()"
          />
        </ng-container>
      </ng-container>

      <ng-template #htmlTpl>
        <div [innerHTML]="vm.html"></div>
      </ng-template>

      <div class="modal-actions">
        <!-- Inversion des classes selon la présence de l'input -->
        <button
          [ngClass]="{ btn: true, primary: !showInput, danger: showInput }"
          (click)="svc.cancel()"
        >
          {{ vm.cancelText }}
        </button>

        <button
          [ngClass]="{ btn: true, danger: !showInput, primary: showInput }"
          (click)="onConfirm()"
          [disabled]="showInput && !inputValue.trim()"
        >
          {{ vm.confirmText }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      /* Overlay et container */
      .modal-overlay-2 {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        backdrop-filter: blur(2px);
        z-index: 1400;
      }
      .modal-content.large {
        position: fixed;
        left: 50%;
        top: 20px;
        transform: translateX(-50%);
        width: min(600px, calc(100vw - 32px));
        max-height: calc(100vh - 40px);
        overflow: hidden;
        background: #fff;
        border-radius: 14px;
        border: 1px solid #ede9fe;
        box-shadow: 0 16px 48px rgba(127, 0, 255, 0.18);
        padding: 18px 18px 14px;
        z-index: 1401;
        animation: slideDownTop 0.22s ease-out;
      }
      @keyframes slideDownTop {
        from {
          opacity: 0;
          transform: translate(-50%, -8px);
        }
        to {
          opacity: 1;
          transform: translate(-50%, 0);
        }
      }

      /* Actions */
      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 12px;
      }

      /* Boutons */
      .btn {
        border-radius: 10px;
        padding: 8px 12px;
        font-weight: 600;
        line-height: 1;
        transition: filter 0.15s ease, transform 0.02s ease;
      }
      .btn:active {
        transform: translateY(1px);
      }
      .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        filter: grayscale(20%);
      }
      .btn.primary {
        background: linear-gradient(135deg, #7f00ff, #eaccff);
        color: #fff;
        border: none;
      }
      .btn.danger {
        background: #b91c1c;
        color: #fff;
        border: 1px solid #e5e7eb;
      }

      /* Input amélioré */
      .modal-input {
        width: 100%;
        margin-top: 10px;
        padding: 10px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        font-size: 14px;
        color: #111827;
        transition: box-shadow 0.15s ease, border-color 0.15s ease;
      }
      .modal-input::placeholder {
        color: #9ca3af;
      }
      .modal-input:focus {
        outline: 2px solid #7f00ff33;
        box-shadow: 0 0 0 3px #7f00ff22;
        border-color: #c4b5fd;
      }
      .modal-input.danger {
        border-color: #b91c1c;
        box-shadow: 0 0 0 3px #b91c1c22;
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  vm = this.svc.state$.value;
  inputValue = this.vm.inputValue || '';

  constructor(public svc: ConfirmDialogService) {
    this.svc.state$.subscribe((s) => {
      this.vm = s;
      this.inputValue = s.inputValue || '';
    });
  }

  get showInput(): boolean {
    return !!this.vm.inputPlaceholder;
  }

  onConfirm() {
    if (this.showInput && !this.inputValue.trim()) {
      return;
    }
    this.svc.setInputValue(this.inputValue);
    this.svc.confirm();
  }
}
