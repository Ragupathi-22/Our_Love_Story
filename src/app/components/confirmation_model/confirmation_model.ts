// src/app/shared/components/confirm-modal/confirm-modal.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogService } from '../../services/confirmationService/confirm_dialog.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="visible" class="fixed inset-0 bg-pink-200/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-gradient-to-br from-pink-100 to-pink-50 rounded-2xl shadow-lg p-6 w-full max-w-sm border border-pink-200">
        <h3 class="text-xl font-bold mb-2 text-pink-600 text-center">
        🤔 {{ title }} 🤔
        </h3>
        <p class="text-sm text-gray-700 mb-6 text-center italic whitespace-pre-line">
          {{ message }}
        </p>
        <div class="flex justify-center gap-3">
          <button 
            class="px-5 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium shadow-sm transition"
            (click)="cancel()">
            {{ cancelText }}
          </button>
          <button 
            class="px-5 py-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white font-medium shadow-md transition"
            (click)="confirm()">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class ConfirmModalComponent implements OnInit {
  visible = false;
  title = '';
  message = '';
  confirmText = 'Yes 💕';
  cancelText = 'No 😘';
  private resolve!: (confirmed: boolean) => void;

  constructor(private confirmService: ConfirmDialogService) {}

  ngOnInit() {
    this.confirmService.confirm$.subscribe(({ title, message, confirmText, cancelText, resolve }) => {
      this.visible = true;
      this.title = title;
      this.message = message;
      this.confirmText = confirmText;
      this.cancelText = cancelText;
      this.resolve = resolve;
    });
  }

  confirm() {
    this.visible = false;
    this.resolve(true);
  }

  cancel() {
    this.visible = false;
    this.resolve(false);
  }
}
