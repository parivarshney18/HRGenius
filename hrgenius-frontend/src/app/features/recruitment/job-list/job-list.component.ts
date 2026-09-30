import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Job } from '../../../core/models/job.model';
import { Department } from '../../../core/models/department.model';
import { Candidate } from '../../../core/models/candidate.model';
import { JobService } from '../../../core/services/job.service';
import { CandidateService } from '../../../core/services/candidate.service';
import { DepartmentService } from '../../../core/services/department.service';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { TableColumn, TableAction } from '../../../shared/components/data-table/data-table.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { JobDialogComponent } from '../job-dialog/job-dialog.component';

@Component({
  selector: 'app-job-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    DataTableComponent
  ],
  templateUrl: './job-list.component.html',
  styleUrl: './job-list.component.scss'
})
export class JobListComponent implements OnInit {
  private readonly jobService = inject(JobService);
  private readonly candidateService = inject(CandidateService);
  private readonly departmentService = inject(DepartmentService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  public readonly jobs = signal<Job[]>([]);
  public readonly departments = signal<Department[]>([]);
  public readonly candidates = signal<Candidate[]>([]);
  public readonly isLoading = signal<boolean>(true);
  public selectedDepartmentId = signal<string>('ALL');

  public readonly departmentMap = computed(() => {
    const map = new Map<string | number, string>();
    this.departments().forEach(d => map.set(String(d.department_id), d.department_name));
    return map;
  });

  public readonly candidateCounts = computed(() => {
    const counts = new Map<string | number, number>();
    this.candidates().forEach(c => {
      const current = counts.get(String(c.job_id)) || 0;
      counts.set(String(c.job_id), current + 1);
    });
    return counts;
  });

  public readonly filteredJobs = computed(() => {
    const all = this.jobs();
    const deptFilter = this.selectedDepartmentId();
    if (deptFilter === 'ALL') {
      return all;
    }
    return all.filter(j => String(j.department_id) === deptFilter);
  });

  public readonly totalOpenings = computed(() =>
    this.jobs().reduce((sum, j) => sum + (Number(j.openings) || 0), 0)
  );

  public readonly columns: TableColumn<Job>[] = [
    {
      key: 'job_title',
      header: 'Job Title & Requisition',
      sortable: true
    },
    {
      key: 'department_id',
      header: 'Department',
      sortable: true,
      cell: (row) => this.departmentMap().get(String(row.department_id)) || `Dept #${row.department_id}`
    },
    {
      key: 'openings',
      header: 'Openings',
      sortable: true,
      width: '100px',
      cell: (row) => `${row.openings} Pos.`
    },
    {
      key: 'candidates',
      header: 'Applicants',
      sortable: false,
      width: '120px',
      cell: (row) => {
        const count = this.candidateCounts().get(String(row.job_id)) || 0;
        return `${count} Candidates`;
      }
    },
    {
      key: 'posting_date',
      header: 'Posted Date',
      sortable: true,
      width: '130px'
    },
    {
      key: 'closing_date',
      header: 'Closing Deadline',
      sortable: true,
      width: '140px'
    }
  ];

  public readonly actions: TableAction<Job>[] = [
    {
      name: 'candidates',
      icon: 'groups',
      color: 'primary',
      tooltip: 'View Applicants Pipeline'
    },
    {
      name: 'edit',
      icon: 'edit',
      color: 'primary',
      tooltip: 'Edit Job Opening'
    },
    {
      name: 'delete',
      icon: 'delete',
      color: 'warn',
      tooltip: 'Delete Job Opening'
    }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  public loadData(): void {
    this.isLoading.set(true);

    this.departmentService.getAll().subscribe({
      next: (depts) => {
        this.departments.set(depts);
        this.jobService.getAll().subscribe({
          next: (jobsList) => {
            this.jobs.set(jobsList);
            this.candidateService.getAll().subscribe({
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
            this.snackBar.open('Failed to load jobs.', 'Dismiss', { duration: 3000 });
          }
        });
      },
      error: () => {
        this.isLoading.set(false);
        this.snackBar.open('Failed to load departments.', 'Dismiss', { duration: 3000 });
      }
    });
  }

  public onDepartmentFilterChange(deptId: string): void {
    this.selectedDepartmentId.set(deptId);
  }

  public handleActionClick(event: { action: string; row: Job }): void {
    switch (event.action) {
      case 'candidates':
        this.router.navigate(['/recruitment/jobs', event.row.job_id, 'candidates']);
        break;
      case 'edit':
        this.openEditDialog(event.row);
        break;
      case 'delete':
        this.confirmDelete(event.row);
        break;
    }
  }

  public openCreateDialog(): void {
    const dialogRef = this.dialog.open(JobDialogComponent, {
      width: '600px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe((result: Job | null) => {
      if (result) {
        this.snackBar.open(`Job "${result.job_title}" published successfully.`, 'Dismiss', {
          duration: 3500
        });
        this.loadData();
      }
    });
  }

  private openEditDialog(job: Job): void {
    const dialogRef = this.dialog.open(JobDialogComponent, {
      width: '600px',
      data: {
        mode: 'edit',
        job: { ...job }
      }
    });

    dialogRef.afterClosed().subscribe((result: Job | null) => {
      if (result) {
        this.snackBar.open(`Job "${result.job_title}" updated successfully.`, 'Dismiss', {
          duration: 3500
        });
        this.loadData();
      }
    });
  }

  private confirmDelete(job: Job): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Job Requisition',
        message: `Are you sure you want to delete "${job.job_title}"? All submitted candidate records under this job will also be removed.`,
        confirmText: 'Delete Job',
        cancelText: 'Cancel',
        confirmColor: 'warn',
        icon: 'work_off'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.isLoading.set(true);
        this.jobService.delete(job.job_id).subscribe({
          next: () => {
            this.snackBar.open(`Job "${job.job_title}" deleted.`, 'Dismiss', {
              duration: 3500
            });
            this.loadData();
          },
          error: (err) => {
            this.isLoading.set(false);
            this.snackBar.open(err?.message || 'Failed to delete job', 'Dismiss', {
              duration: 3500
            });
          }
        });
      }
    });
  }
}
