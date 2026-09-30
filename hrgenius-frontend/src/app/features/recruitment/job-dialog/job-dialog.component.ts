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
import { Job } from '../../../core/models/job.model';
import { Department } from '../../../core/models/department.model';
import { JobService } from '../../../core/services/job.service';
import { DepartmentService } from '../../../core/services/department.service';

export interface JobDialogData {
  job?: Job;
  mode: 'create' | 'edit';
}

@Component({
  selector: 'app-job-dialog',
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
  templateUrl: './job-dialog.component.html',
  styleUrl: './job-dialog.component.scss'
})
export class JobDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<JobDialogComponent>);
  public readonly data: JobDialogData = inject(MAT_DIALOG_DATA);
  private readonly jobService = inject(JobService);
  private readonly departmentService = inject(DepartmentService);

  public readonly isEditMode = this.data.mode === 'edit';
  public readonly isSaving = signal(false);
  public readonly errorMessage = signal<string | null>(null);
  public readonly departments = signal<Department[]>([]);

  public form: FormGroup = this.fb.group({
    job_title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    department_id: [null, [Validators.required]],
    openings: [1, [Validators.required, Validators.min(1)]],
    posting_date: ['', [Validators.required]],
    closing_date: ['', [Validators.required]],
    description: ['', [Validators.required, Validators.maxLength(500)]],
    requirements: ['', [Validators.required, Validators.maxLength(500)]]
  });

  ngOnInit(): void {
    this.departmentService.getAll().subscribe(depts => {
      this.departments.set(depts);
    });

    if (this.isEditMode && this.data.job) {
      this.form.patchValue({
        job_title: this.data.job.job_title,
        department_id: Number(this.data.job.department_id),
        openings: this.data.job.openings,
        posting_date: this.data.job.posting_date,
        closing_date: this.data.job.closing_date,
        description: this.data.job.description,
        requirements: this.data.job.requirements
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      const nextMonth = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      this.form.patchValue({
        posting_date: today,
        closing_date: nextMonth
      });
    }
  }

  public onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const values = this.form.value;

    if (this.isEditMode && this.data.job) {
      this.jobService.update(this.data.job.job_id, values).subscribe({
        next: (updated) => {
          this.isSaving.set(false);
          this.dialogRef.close(updated);
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMessage.set(err?.message || 'Failed to update job opening.');
        }
      });
    } else {
      this.jobService.create(values).subscribe({
        next: (created) => {
          this.isSaving.set(false);
          this.dialogRef.close(created);
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMessage.set(err?.message || 'Failed to create job opening.');
        }
      });
    }
  }

  public onCancel(): void {
    this.dialogRef.close(null);
  }
}
