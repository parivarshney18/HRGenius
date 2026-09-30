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
import { PerformanceService } from '../../../core/services/performance.service';
import { Employee } from '../../../core/models/employee.model';

export interface PerformanceGoalDialogData {
  managerId: string | number;
  teamMembers: Employee[];
}

@Component({
  selector: 'app-performance-goal-dialog',
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
  templateUrl: './performance-goal-dialog.component.html',
  styleUrl: './performance-goal-dialog.component.scss'
})
export class PerformanceGoalDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<PerformanceGoalDialogComponent>);
  public readonly data: PerformanceGoalDialogData = inject(MAT_DIALOG_DATA);
  private readonly performanceService = inject(PerformanceService);

  public readonly isSubmitting = signal(false);
  public readonly errorMessage = signal<string | null>(null);

  public readonly periods = ['Q4 2026', 'Q1 2027', 'Annual 2026', 'Q3 2026'];

  public form: FormGroup = this.fb.group({
    employee_id: [null, [Validators.required]],
    review_period: ['Q4 2026', [Validators.required]],
    goal: ['', [Validators.required, Validators.minLength(10)]]
  });

  public onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const val = this.form.value;
    const today = new Date().toISOString().split('T')[0];

    this.performanceService.create({
      employee_id: val.employee_id,
      review_period: val.review_period,
      goal: val.goal,
      achievement: 'Pending sprint execution',
      rating: 0,
      feedback: 'Goal initialized. Review scheduled at period close.',
      reviewed_by: this.data.managerId,
      review_date: today,
      performance_status: 'Goal Set'
    }).subscribe({
      next: (created) => {
        this.isSubmitting.set(false);
        this.dialogRef.close(created);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err?.message || 'Failed to create performance goal.');
      }
    });
  }

  public onCancel(): void {
    this.dialogRef.close(null);
  }
}
