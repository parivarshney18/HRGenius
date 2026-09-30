import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { Onboarding } from '../../../core/models/onboarding.model';
import { Candidate } from '../../../core/models/candidate.model';
import { Job } from '../../../core/models/job.model';
import { Department } from '../../../core/models/department.model';
import { Employee } from '../../../core/models/employee.model';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { CandidateService } from '../../../core/services/candidate.service';
import { JobService } from '../../../core/services/job.service';
import { DepartmentService } from '../../../core/services/department.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { TableColumn, TableAction } from '../../../shared/components/data-table/data-table.model';
import { OnboardingDialogComponent } from '../onboarding-dialog/onboarding-dialog.component';

@Component({
  selector: 'app-onboarding-list',
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
    MatMenuModule,
    DataTableComponent
  ],
  templateUrl: './onboarding-list.component.html',
  styleUrl: './onboarding-list.component.scss'
})
export class OnboardingListComponent implements OnInit {
  private readonly onboardingService = inject(OnboardingService);
  private readonly candidateService = inject(CandidateService);
  private readonly jobService = inject(JobService);
  private readonly departmentService = inject(DepartmentService);
  private readonly employeeService = inject(EmployeeService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  public readonly onboardings = signal<Onboarding[]>([]);
  public readonly candidates = signal<Candidate[]>([]);
  public readonly jobs = signal<Job[]>([]);
  public readonly departments = signal<Department[]>([]);
  public readonly employees = signal<Employee[]>([]);
  public readonly isLoading = signal<boolean>(true);

  public readonly filterTab = signal<'PENDING' | 'COMPLETED' | 'ALL'>('PENDING');

  public readonly candidateMap = computed(() => {
    const map = new Map<string | number, Candidate>();
    this.candidates().forEach(c => map.set(String(c.candidate_id), c));
    return map;
  });

  public readonly jobMap = computed(() => {
    const map = new Map<string | number, Job>();
    this.jobs().forEach(j => map.set(String(j.job_id), j));
    return map;
  });

  public readonly departmentMap = computed(() => {
    const map = new Map<string | number, string>();
    this.departments().forEach(d => map.set(String(d.department_id), d.department_name));
    return map;
  });

  public readonly employeeMap = computed(() => {
    const map = new Map<string | number, string>();
    this.employees().forEach(e => map.set(String(e.employee_id), `${e.first_name} ${e.last_name}`));
    return map;
  });

  public readonly pendingCount = computed(() =>
    this.onboardings().filter(o => o.onboarding_status.toLowerCase() !== 'completed').length
  );

  public readonly completedCount = computed(() =>
    this.onboardings().filter(o => o.onboarding_status.toLowerCase() === 'completed').length
  );

  public readonly filteredOnboardings = computed(() => {
    const all = this.onboardings();
    const tab = this.filterTab();
    if (tab === 'PENDING') {
      return all.filter(o => o.onboarding_status.toLowerCase() !== 'completed');
    }
    if (tab === 'COMPLETED') {
      return all.filter(o => o.onboarding_status.toLowerCase() === 'completed');
    }
    return all;
  });

  // Selected candidates waiting to be initiated
  public readonly selectedCandidatesWithoutOnboarding = computed(() => {
    const existingCandIds = new Set(this.onboardings().map(o => String(o.candidate_id)));
    return this.candidates().filter(
      c => c.application_status.toLowerCase() === 'selected' && !existingCandIds.has(String(c.candidate_id))
    );
  });

  public readonly columns: TableColumn<Onboarding>[] = [
    {
      key: 'candidate_id',
      header: 'Selected Candidate',
      sortable: true,
      cell: (row) => {
        const cand = this.candidateMap().get(String(row.candidate_id));
        return cand ? cand.candidate_name : `Candidate #${row.candidate_id}`;
      }
    },
    {
      key: 'job_title',
      header: 'Assigned Position',
      sortable: true,
      cell: (row) => {
        const cand = this.candidateMap().get(String(row.candidate_id));
        const job = cand ? this.jobMap().get(String(cand.job_id)) : null;
        return job ? job.job_title : 'Enterprise Specialist';
      }
    },
    {
      key: 'joining_date',
      header: 'Joining Date',
      sortable: true,
      width: '130px'
    },
    {
      key: 'document_status',
      header: 'Documents',
      type: 'badge',
      sortable: true,
      width: '120px',
      badgeConfig: {
        'Pending': { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' },
        'Submitted': { bg: '#fef9c3', color: '#854d0e', border: '#fef08a' },
        'Verified': { bg: '#dcfce7', color: '#15803d', border: '#86efac' }
      }
    },
    {
      key: 'verification_status',
      header: 'Background Check',
      type: 'badge',
      sortable: true,
      width: '140px',
      badgeConfig: {
        'Pending': { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' },
        'In Progress': { bg: '#e0f2fe', color: '#0284c7', border: '#bae6fd' },
        'Passed': { bg: '#dcfce7', color: '#15803d', border: '#86efac' }
      }
    },
    {
      key: 'assigned_department',
      header: 'Department',
      sortable: true,
      cell: (row) => this.departmentMap().get(String(row.assigned_department)) || `Dept #${row.assigned_department}`
    },
    {
      key: 'assigned_manager',
      header: 'Reporting Manager',
      sortable: true,
      cell: (row) => this.employeeMap().get(String(row.assigned_manager)) || 'Unassigned'
    },
    {
      key: 'onboarding_status',
      header: 'Status',
      type: 'badge',
      sortable: true,
      width: '120px',
      badgeConfig: {
        'Pending': { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' },
        'Completed': { bg: '#dcfce7', color: '#15803d', border: '#86efac' }
      }
    }
  ];

  public readonly actions: TableAction<Onboarding>[] = [
    {
      name: 'process',
      icon: 'how_to_reg',
      color: 'primary',
      tooltip: 'Process Onboarding',
      visible: (row) => row.onboarding_status.toLowerCase() !== 'completed'
    },
    {
      name: 'view_profile',
      icon: 'badge',
      color: 'accent',
      tooltip: 'View Created Employee Profile',
      visible: (row) => row.onboarding_status.toLowerCase() === 'completed' && !!row.employee_id
    }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  public loadData(): void {
    this.isLoading.set(true);

    this.onboardingService.getAll().subscribe(onboardings => {
      this.onboardings.set(onboardings);

      this.candidateService.getAll().subscribe(cands => {
        this.candidates.set(cands);

        this.jobService.getAll().subscribe(jobs => {
          this.jobs.set(jobs);

          this.departmentService.getAll().subscribe(depts => {
            this.departments.set(depts);

            this.employeeService.getAll().subscribe(emps => {
              this.employees.set(emps);
              this.isLoading.set(false);
            });
          });
        });
      });
    });
  }

  public setFilterTab(tab: 'PENDING' | 'COMPLETED' | 'ALL'): void {
    this.filterTab.set(tab);
  }

  public handleActionClick(event: { action: string; row: Onboarding }): void {
    if (event.action === 'process') {
      this.openProcessDialog(event.row);
    } else if (event.action === 'view_profile') {
      if (event.row.employee_id) {
        this.router.navigate(['/employees', event.row.employee_id]);
      }
    }
  }

  public openProcessDialog(onboarding: Onboarding): void {
    const cand = this.candidateMap().get(String(onboarding.candidate_id)) || {
      candidate_id: onboarding.candidate_id,
      job_id: 1,
      candidate_name: 'Selected Applicant',
      candidate_email: 'candidate@example.com',
      resume: 'resume.pdf',
      application_date: '2026-09-01',
      application_status: 'Selected'
    };

    const job = this.jobMap().get(String(cand.job_id));

    const dialogRef = this.dialog.open(OnboardingDialogComponent, {
      width: '680px',
      data: { onboarding, candidate: cand, job }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        if (res.action === 'completed') {
          this.snackBar.open(
            `Onboarding completed! New employee ${res.result.employee.first_name} ${res.result.employee.last_name} (${res.result.employee.employee_code}) added.`,
            'View Profile',
            { duration: 5000 }
          ).onAction().subscribe(() => {
            this.router.navigate(['/employees', res.result.employee.employee_id]);
          });
        } else {
          this.snackBar.open('Onboarding progress saved.', 'Dismiss', { duration: 3000 });
        }
        this.loadData();
      }
    });
  }

  public initiateOnboardingFor(candidate: Candidate): void {
    const job = this.jobMap().get(String(candidate.job_id));

    this.onboardingService.create({
      candidate_id: candidate.candidate_id,
      employee_id: null,
      joining_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      document_status: 'Submitted',
      verification_status: 'In Progress',
      assigned_department: job ? Number(job.department_id) : 1,
      assigned_manager: 1,
      onboarding_status: 'Pending'
    }).subscribe((created) => {
      this.snackBar.open(`Onboarding initiated for ${candidate.candidate_name}.`, 'Process Now', {
        duration: 4000
      }).onAction().subscribe(() => {
        this.openProcessDialog(created);
      });
      this.loadData();
    });
  }
}
