import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PerformanceService } from '../../../core/services/performance.service';
import { Performance } from '../../../core/models/performance.model';
import { Employee } from '../../../core/models/employee.model';

export interface PerformanceReviewDialogData {
  performance: Performance;
  employee?: Employee;
  reviewerId: string | number;
}

@Component({
  selector: 'app-performance-review-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './performance-review-dialog.component.html',
  styleUrl: './performance-review-dialog.component.scss'
})
export class PerformanceReviewDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<PerformanceReviewDialogComponent>);
  public readonly data: PerformanceReviewDialogData = inject(MAT_DIALOG_DATA);
  private readonly performanceService = inject(PerformanceService);

  public readonly isSubmitting = signal(false);
  public readonly errorMessage = signal<string | null>(null);
  public readonly selectedRating = signal<number>(5);

  public readonly ratingLabels: Record<number, string> = {
    1: '1 Star - Unsatisfactory (Needs Immediate Improvement)',
    2: '2 Stars - Marginal (Partially Met Expectations)',
    3: '3 Stars - Proficient (Fully Met Standard Expectations)',
    4: '4 Stars - Exceeds Expectations (High Performer)',
    5: '5 Stars - Outstanding / Role Model (Exceptional Impact)'
  };

  public form: FormGroup = this.fb.group({
    achievement: ['', [Validators.required, Validators.minLength(5)]],
    feedback: ['', [Validators.required, Validators.minLength(10)]]
  });

  ngOnInit(): void {
    if (this.data.performance.achievement && this.data.performance.achievement !== 'Pending sprint execution') {
      this.form.patchValue({ achievement: this.data.performance.achievement });
    }
    if (this.data.performance.feedback && !this.data.performance.feedback.includes('Goal initialized')) {
      this.form.patchValue({ feedback: this.data.performance.feedback });
    }
    if (this.data.performance.rating > 0) {
      this.selectedRating.set(this.data.performance.rating);
    }
  }

  public setRating(stars: number): void {
    this.selectedRating.set(stars);
  }

  public onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const val = this.form.value;

    this.performanceService.submitReview(
      this.data.performance.performance_id,
      this.selectedRating(),
      val.feedback,
      val.achievement,
      this.data.reviewerId
    ).subscribe({
      next: (updated) => {
        this.isSubmitting.set(false);
        this.dialogRef.close(updated);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err?.message || 'Failed to submit performance appraisal.');
      }
    });
  }

  public onCancel(): void {
    this.dialogRef.close(null);
  }
}
