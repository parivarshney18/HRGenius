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
import { Candidate } from '../../../core/models/candidate.model';
import { CandidateService } from '../../../core/services/candidate.service';

export interface CandidateStatusDialogData {
  candidate: Candidate;
}

@Component({
  selector: 'app-candidate-status-dialog',
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
  templateUrl: './candidate-status-dialog.component.html',
  styleUrl: './candidate-status-dialog.component.scss'
})
export class CandidateStatusDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CandidateStatusDialogComponent>);
  public readonly data: CandidateStatusDialogData = inject(MAT_DIALOG_DATA);
  private readonly candidateService = inject(CandidateService);

  public readonly isSaving = signal(false);
  public readonly errorMessage = signal<string | null>(null);

  public readonly statusOptions = [
    'Applied',
    'Shortlisted',
    'Interviewed',
    'Selected',
    'Rejected'
  ];

  public form: FormGroup = this.fb.group({
    application_status: ['', [Validators.required]],
    interview_date: [''],
    interview_result: ['']
  });

  ngOnInit(): void {
    const c = this.data.candidate;
    this.form.patchValue({
      application_status: c.application_status,
      interview_date: c.interview_date || '',
      interview_result: c.interview_result || ''
    });
  }

  public onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const { application_status, interview_date, interview_result } = this.form.value;

    this.candidateService
      .updateStatus(this.data.candidate.candidate_id, application_status, interview_date, interview_result)
      .subscribe({
        next: (updated) => {
          this.isSaving.set(false);
          this.dialogRef.close(updated);
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMessage.set(err?.message || 'Failed to update candidate record.');
        }
      });
  }

  public onCancel(): void {
    this.dialogRef.close(null);
  }
}
