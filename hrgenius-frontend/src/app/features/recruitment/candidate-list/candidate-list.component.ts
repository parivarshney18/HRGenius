import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Job } from '../../../core/models/job.model';
import { Department } from '../../../core/models/department.model';
import { Candidate } from '../../../core/models/candidate.model';
import { JobService } from '../../../core/services/job.service';
import { CandidateService } from '../../../core/services/candidate.service';
import { DepartmentService } from '../../../core/services/department.service';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { TableColumn, TableAction } from '../../../shared/components/data-table/data-table.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CandidateStatusDialogComponent } from '../candidate-status-dialog/candidate-status-dialog.component';
import { CandidateFormDialogComponent } from '../candidate-form-dialog/candidate-form-dialog.component';

@Component({
  selector: 'app-candidate-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    DataTableComponent
  ],
  templateUrl: './candidate-list.component.html',
  styleUrl: './candidate-list.component.scss'
})
export class CandidateListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly jobService = inject(JobService);
  private readonly candidateService = inject(CandidateService);
  private readonly departmentService = inject(DepartmentService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  public readonly jobId = signal<string | number | null>(null);
  public readonly job = signal<Job | null>(null);
  public readonly department = signal<Department | null>(null);
  public readonly candidates = signal<Candidate[]>([]);
  public readonly isLoading = signal<boolean>(true);
  public readonly selectedStatusFilter = signal<string>('ALL');

  public readonly statusCategories = ['ALL', 'Applied', 'Shortlisted', 'Interviewed', 'Selected', 'Rejected'];

  public readonly filteredCandidates = computed(() => {
    const list = this.candidates();
    const st = this.selectedStatusFilter();
    if (st === 'ALL') return list;
    return list.filter(c => c.application_status.toLowerCase() === st.toLowerCase());
  });

  public readonly columns: TableColumn<Candidate>[] = [
    {
      key: 'candidate_name',
      header: 'Applicant',
      sortable: true
    },
    {
      key: 'candidate_email',
      header: 'Email Address',
      sortable: true
    },
    {
      key: 'resume',
      header: 'Resume',
      sortable: false,
      width: '180px'
    },
    {
      key: 'application_date',
      header: 'Applied Date',
      sortable: true,
      width: '120px'
    },
    {
      key: 'application_status',
      header: 'Status',
      type: 'badge',
      sortable: true,
      width: '130px',
      badgeConfig: {
        'Applied': { bg: '#e0f2fe', color: '#0284c7', border: '#bae6fd' },
        'Shortlisted': { bg: '#fef9c3', color: '#854d0e', border: '#fef08a' },
        'Interviewed': { bg: '#ede9fe', color: '#6d28d9', border: '#ddd6fe' },
        'Selected': { bg: '#dcfce7', color: '#15803d', border: '#86efac' },
        'Rejected': { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' }
      }
    },
    {
      key: 'interview_date',
      header: 'Interview Date',
      sortable: true,
      width: '130px',
      cell: (row) => row.interview_date || 'Not Scheduled'
    },
    {
      key: 'interview_result',
      header: 'Interview Feedback / Result',
      sortable: false,
      cell: (row) => row.interview_result || '—'
    }
  ];

  public readonly actions: TableAction<Candidate>[] = [
    {
      name: 'status',
      icon: 'rate_review',
      color: 'primary',
      tooltip: 'Evaluate & Schedule Interview'
    },
    {
      name: 'delete',
      icon: 'delete',
      color: 'warn',
      tooltip: 'Remove Application'
    }
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('jobId');
    if (id) {
      this.jobId.set(id);
      this.loadJobAndCandidates(id);
    } else {
      this.router.navigate(['/recruitment']);
    }
  }

  public loadJobAndCandidates(jobId: string | number): void {
    this.isLoading.set(true);

    this.jobService.getById(jobId).subscribe({
      next: (jobData) => {
        if (!jobData) {
          this.snackBar.open('Job opening not found.', 'Dismiss', { duration: 3000 });
          this.router.navigate(['/recruitment']);
          return;
        }

        this.job.set(jobData);

        this.departmentService.getById(jobData.department_id).subscribe(dept => {
          if (dept) this.department.set(dept);
        });

        this.candidateService.getByJobId(jobId).subscribe({
          next: (cands) => {
            this.candidates.set(cands);
            this.isLoading.set(false);
          },
          error: () => {
            this.isLoading.set(false);
          }
        });
      },
      error: () => {
        this.isLoading.set(false);
        this.snackBar.open('Error loading job details.', 'Dismiss', { duration: 3000 });
      }
    });
  }

  public setStatusFilter(status: string): void {
    this.selectedStatusFilter.set(status);
  }

  public handleActionClick(event: { action: string; row: Candidate }): void {
    if (event.action === 'status') {
      this.openStatusDialog(event.row);
    } else if (event.action === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  public openStatusDialog(candidate: Candidate): void {
    const dialogRef = this.dialog.open(CandidateStatusDialogComponent, {
      width: '540px',
      data: { candidate: { ...candidate } }
    });

    dialogRef.afterClosed().subscribe((result: Candidate | null) => {
      if (result) {
        this.snackBar.open(
          `Candidate "${result.candidate_name}" updated to "${result.application_status}".`,
          'Dismiss',
          { duration: 3500 }
        );
        this.loadJobAndCandidates(this.jobId()!);
      }
    });
  }

  public openAddCandidateDialog(): void {
    const j = this.job();
    if (!j) return;

    const dialogRef = this.dialog.open(CandidateFormDialogComponent, {
      width: '520px',
      data: {
        jobId: j.job_id,
        jobTitle: j.job_title
      }
    });

    dialogRef.afterClosed().subscribe((created: Candidate | null) => {
      if (created) {
        this.snackBar.open(`Applicant "${created.candidate_name}" registered.`, 'Dismiss', {
          duration: 3500
        });
        this.loadJobAndCandidates(this.jobId()!);
      }
    });
  }

  private confirmDelete(candidate: Candidate): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Candidate Application',
        message: `Are you sure you want to remove the application for "${candidate.candidate_name}"?`,
        confirmText: 'Remove Application',
        cancelText: 'Cancel',
        confirmColor: 'warn',
        icon: 'person_remove'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.isLoading.set(true);
        this.candidateService.delete(candidate.candidate_id).subscribe({
          next: () => {
            this.snackBar.open(`Application for "${candidate.candidate_name}" removed.`, 'Dismiss', {
              duration: 3500
            });
            this.loadJobAndCandidates(this.jobId()!);
          },
          error: (err) => {
            this.isLoading.set(false);
            this.snackBar.open(err?.message || 'Failed to remove applicant', 'Dismiss', {
              duration: 3500
            });
          }
        });
      }
    });
  }
}
