import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmDialogData } from './confirm-dialog.model';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss'
})
export class ConfirmDialogComponent {
  public readonly data: ConfirmDialogData = inject(MAT_DIALOG_DATA, { optional: true }) || {};
  public readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);

  public readonly title = this.data.title || 'Confirm Action';
  public readonly message = this.data.message || 'Are you sure you want to proceed with this action?';
  public readonly confirmText = this.data.confirmText || 'Confirm';
  public readonly cancelText = this.data.cancelText || 'Cancel';
  public readonly confirmColor = this.data.confirmColor || 'primary';
  public readonly icon = this.data.icon || 'help_outline';

  public onConfirm(): void {
    this.dialogRef.close(true);
  }

  public onCancel(): void {
    this.dialogRef.close(false);
  }
}
