import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CandidateService } from '../../../core/services/candidate.service';

export interface CandidateFormDialogData {
  jobId: string | number;
  jobTitle: string;
}

@Component({
  selector: 'app-candidate-form-dialog',
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
  templateUrl: './candidate-form-dialog.component.html',
  styleUrl: './candidate-form-dialog.component.scss'
})
export class CandidateFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CandidateFormDialogComponent>);
  public readonly data: CandidateFormDialogData = inject(MAT_DIALOG_DATA);
  private readonly candidateService = inject(CandidateService);

  public readonly isSaving = signal(false);
  public readonly errorMessage = signal<string | null>(null);

  public form: FormGroup = this.fb.group({
    candidate_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(70)]],
    candidate_email: ['', [Validators.required, Validators.email]],
    resume: ['resume_applicant.pdf', [Validators.required]],
    application_date: [new Date().toISOString().split('T')[0], [Validators.required]]
  });

  ngOnInit(): void {}

  public onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const values = this.form.value;
    const newCandidate = {
      job_id: this.data.jobId,
      candidate_name: values.candidate_name,
      candidate_email: values.candidate_email,
      resume: values.resume,
      application_date: values.application_date,
      application_status: 'Applied',
      interview_date: null,
      interview_result: null
    };

    this.candidateService.create(newCandidate).subscribe({
      next: (created) => {
        this.isSaving.set(false);
        this.dialogRef.close(created);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(err?.message || 'Failed to record candidate application.');
      }
    });
  }

  public onCancel(): void {
    this.dialogRef.close(null);
  }
}
