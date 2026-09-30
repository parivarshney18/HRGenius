import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LeaveService, calculateLeaveDays } from '../../../core/services/leave.service';
import { Employee } from '../../../core/models/employee.model';

export interface LeaveApplyDialogData {
  employee: Employee;
}

@Component({
  selector: 'app-leave-apply-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './leave-apply-dialog.component.html',
  styleUrl: './leave-apply-dialog.component.scss'
})
export class LeaveApplyDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<LeaveApplyDialogComponent>);
  public readonly data: LeaveApplyDialogData = inject(MAT_DIALOG_DATA);
  private readonly leaveService = inject(LeaveService);

  public readonly isSubmitting = signal(false);
  public readonly errorMessage = signal<string | null>(null);
  public readonly calculatedDays = signal<number>(1);
  public readonly hasOverlapWarning = signal<boolean>(false);

  public readonly leaveTypes = [
    'Annual Leave',
    'Sick Leave',
    'Casual Leave',
    'Maternity Leave',
    'Unpaid Leave'
  ];

  public form: FormGroup = this.fb.group({
    leave_type: ['Annual Leave', [Validators.required]],
    start_date: [new Date().toISOString().split('T')[0], [Validators.required]],
    end_date: [new Date().toISOString().split('T')[0], [Validators.required]],
    reason: ['', [Validators.required, Validators.minLength(5)]]
  });

  ngOnInit(): void {
    this.updateCalculation();

    this.form.valueChanges.subscribe(() => {
      this.updateCalculation();
    });
  }

  private updateCalculation(): void {
    const { start_date, end_date } = this.form.value;
    if (start_date && end_date) {
      const days = calculateLeaveDays(start_date, end_date);
      this.calculatedDays.set(days);

      // Check overlap
      const overlap = this.leaveService.hasOverlap(this.data.employee.employee_id, start_date, end_date);
      this.hasOverlapWarning.set(overlap);
      if (overlap) {
        this.errorMessage.set(`Warning: An active or pending leave already overlaps with this date range.`);
      } else {
        this.errorMessage.set(null);
      }
    } else {
      this.calculatedDays.set(0);
      this.hasOverlapWarning.set(false);
      this.errorMessage.set(null);
    }
  }

  public onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.hasOverlapWarning()) {
      this.errorMessage.set('Cannot submit request: selected dates overlap with an existing leave.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const val = this.form.value;
    const days = this.calculatedDays();

    this.leaveService.apply({
      employee_id: this.data.employee.employee_id,
      leave_type: val.leave_type,
      start_date: val.start_date,
      end_date: val.end_date,
      number_of_days: days,
      reason: val.reason
    }).subscribe({
      next: (created) => {
        this.isSubmitting.set(false);
        this.dialogRef.close(created);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err?.message || 'Failed to submit leave request.');
      }
    });
  }

  public onCancel(): void {
    this.dialogRef.close(null);
  }
}
