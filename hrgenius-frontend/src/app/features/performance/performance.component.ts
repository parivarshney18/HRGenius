import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PerformanceService } from '../../core/services/performance.service';
import { EmployeeService } from '../../core/services/employee.service';
import { DepartmentService } from '../../core/services/department.service';
import { AuthService } from '../../core/services/auth.service';
import { Performance } from '../../core/models/performance.model';
import { Employee } from '../../core/models/employee.model';
import { Department } from '../../core/models/department.model';
import { User } from '../../core/models/user.model';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { TableColumn, TableAction } from '../../shared/components/data-table/data-table.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { PerformanceGoalDialogComponent } from './performance-goal-dialog/performance-goal-dialog.component';
import { PerformanceReviewDialogComponent } from './performance-review-dialog/performance-review-dialog.component';

export interface PerformanceDisplay extends Performance {
  employee_name?: string;
  employee_code?: string;
  department_name?: string;
  designation?: string;
  reviewer_name?: string;
}

@Component({
  selector: 'app-performance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    DataTableComponent
  ],
  templateUrl: './performance.component.html',
  styleUrl: './performance.component.scss'
})
export class PerformanceComponent implements OnInit {
  private readonly performanceService = inject(PerformanceService);
  private readonly employeeService = inject(EmployeeService);
  private readonly departmentService = inject(DepartmentService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  // User & Roles
  public readonly currentUser = this.authService.currentUser;
  public readonly userRole = computed(() => this.currentUser()?.role || 'EMPLOYEE');
  public readonly isAdmin = computed(() => this.userRole() === 'ADMIN');
  public readonly isHR = computed(() => this.userRole() === 'HR');
  public readonly isManager = computed(() => this.userRole() === 'MANAGER');
  public readonly isEmployeeOnly = computed(() => this.userRole() === 'EMPLOYEE');

  public readonly canManageAll = computed(() => this.isAdmin() || this.isHR());
  public readonly canManageTeam = computed(() => this.isAdmin() || this.isManager() || this.isHR());

  // Master Data
  public readonly currentEmployee = signal<Employee | null>(null);
  public readonly employees = signal<Employee[]>([]);
  public readonly departments = signal<Department[]>([]);
  public readonly teamMembers = signal<Employee[]>([]);

  // Datasets
  public readonly allReviews = signal<PerformanceDisplay[]>([]);
  public readonly teamReviews = signal<PerformanceDisplay[]>([]);
  public readonly myReviews = signal<PerformanceDisplay[]>([]);
  public readonly isLoading = signal<boolean>(true);

  // Filters for HR/Admin
  public readonly selectedPeriod = signal<string>('all');
  public readonly selectedRating = signal<string>('all');
  public readonly selectedEmployeeId = signal<string>('all');

  // Status badges config
  public readonly statusBadgeConfig = {
    'Completed': { bg: '#dcfce7', color: '#15803d', border: '#86efac' },
    'In Progress': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    'Goal Set': { bg: '#fef3c7', color: '#b45309', border: '#fcd34d' }
  };

  // Filtered all reviews
  public readonly filteredAllReviews = computed(() => {
    let list = this.allReviews();
    const p = this.selectedPeriod();
    const r = this.selectedRating();
    const e = this.selectedEmployeeId();

    if (p && p !== 'all') {
      list = list.filter(item => item.review_period === p);
    }
    if (r && r !== 'all') {
      list = list.filter(item => String(item.rating) === String(r));
    }
    if (e && e !== 'all') {
      list = list.filter(item => String(item.employee_id) === String(e));
    }
    return list;
  });

  // KPI Metrics
  public readonly metrics = computed(() => {
    const list = this.canManageAll() ? this.allReviews() : (this.isManager() ? this.teamReviews() : this.myReviews());
    const total = list.length;
    const completed = list.filter(r => r.performance_status === 'Completed').length;
    const inProgress = list.filter(r => r.performance_status !== 'Completed').length;

    const ratedList = list.filter(r => r.rating > 0);
    const avgRating = ratedList.length > 0
      ? Math.round((ratedList.reduce((acc, r) => acc + r.rating, 0) / ratedList.length) * 10) / 10
      : 0;

    return { total, completed, inProgress, avgRating };
  });

  // Columns for All Company Reviews (HR / Admin)
  public readonly allColumns: TableColumn<PerformanceDisplay>[] = [
    {
      key: 'employee_name',
      header: 'Employee',
      sortable: true,
      width: '200px',
      cell: (r) => `${r.employee_name || 'EMP #' + r.employee_id} (${r.employee_code || '---'})`
    },
    {
      key: 'department_name',
      header: 'Department',
      sortable: true,
      width: '160px'
    },
    {
      key: 'review_period',
      header: 'Period',
      sortable: true,
      width: '110px'
    },
    {
      key: 'goal',
      header: 'Goal / Objective',
      sortable: true
    },
    {
      key: 'rating',
      header: 'Rating',
      sortable: true,
      width: '130px',
      cell: (r) => r.rating > 0 ? `${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)} (${r.rating}/5)` : 'Pending'
    },
    {
      key: 'performance_status',
      header: 'Status',
      type: 'badge',
      sortable: true,
      width: '120px',
      badgeConfig: this.statusBadgeConfig
    },
    {
      key: 'reviewer_name',
      header: 'Reviewed By',
      sortable: true,
      width: '150px',
      cell: (r) => r.reviewer_name || '--'
    }
  ];

  // Columns for Team Reviews (Manager)
  public readonly teamColumns: TableColumn<PerformanceDisplay>[] = [
    {
      key: 'employee_name',
      header: 'Team Member',
      sortable: true,
      width: '200px',
      cell: (r) => `${r.employee_name || 'EMP #' + r.employee_id} (${r.employee_code || '---'})`
    },
    {
      key: 'review_period',
      header: 'Period',
      sortable: true,
      width: '110px'
    },
    {
      key: 'goal',
      header: 'Assigned Goal',
      sortable: true
    },
    {
      key: 'rating',
      header: 'Rating',
      sortable: true,
      width: '130px',
      cell: (r) => r.rating > 0 ? `${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)} (${r.rating}/5)` : 'Pending'
    },
    {
      key: 'performance_status',
      header: 'Status',
      type: 'badge',
      sortable: true,
      width: '120px',
      badgeConfig: this.statusBadgeConfig
    }
  ];

  // Actions for Manager
  public readonly managerActions: TableAction<PerformanceDisplay>[] = [
    {
      name: 'review',
      icon: 'rate_review',
      color: 'primary',
      tooltip: 'Submit Appraisal Review'
    }
  ];

  // Columns for My Goals (Employee)
  public readonly myColumns: TableColumn<PerformanceDisplay>[] = [
    {
      key: 'review_period',
      header: 'Evaluation Period',
      sortable: true,
      width: '150px'
    },
    {
      key: 'goal',
      header: 'Target Goal / KPI',
      sortable: true
    },
    {
      key: 'achievement',
      header: 'Key Achievements',
      sortable: true
    },
    {
      key: 'rating',
      header: 'Rating',
      sortable: true,
      width: '140px',
      cell: (r) => r.rating > 0 ? `${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)} (${r.rating}/5)` : 'In Progress'
    },
    {
      key: 'feedback',
      header: 'Manager Feedback',
      sortable: true
    },
    {
      key: 'performance_status',
      header: 'Status',
      type: 'badge',
      sortable: true,
      width: '130px',
      badgeConfig: this.statusBadgeConfig
    }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  public loadData(): void {
    this.isLoading.set(true);

    this.departmentService.getAll().subscribe(depts => {
      this.departments.set(depts);

      this.employeeService.getAll().subscribe(emps => {
        this.employees.set(emps);

        const user = this.currentUser();
        const emp = this.findMatchingEmployee(user, emps);
        this.currentEmployee.set(emp || null);

        if (emp) {
          // Identify team members reporting to this manager
          const directReports = emps.filter(e => e.manager_id && String(e.manager_id) === String(emp.employee_id));
          this.teamMembers.set(directReports.length > 0 ? directReports : emps);
        } else {
          this.teamMembers.set(emps);
        }

        this.refreshPerformance();
      });
    });
  }

  public refreshPerformance(): void {
    const emp = this.currentEmployee();
    const emps = this.employees();
    const depts = this.departments();

    this.performanceService.getAll().subscribe(all => {
      const enriched = all.map(p => this.enrichPerformance(p, emps, depts));
      this.allReviews.set(enriched);

      if (emp) {
        // Team reviews
        const teamIds = new Set(
          emps.filter(e => e.manager_id && String(e.manager_id) === String(emp.employee_id)).map(e => String(e.employee_id))
        );
        this.teamReviews.set(enriched.filter(p => teamIds.has(String(p.employee_id))));

        // Personal reviews
        this.myReviews.set(enriched.filter(p => String(p.employee_id) === String(emp.employee_id)));
      }

      this.isLoading.set(false);
    });
  }

  /**
   * Open Set Goal Dialog (Manager)
   */
  public onOpenGoalDialog(): void {
    const emp = this.currentEmployee();
    const mgrId = emp ? emp.employee_id : 1;

    const ref = this.dialog.open(PerformanceGoalDialogComponent, {
      width: '580px',
      data: {
        managerId: mgrId,
        teamMembers: this.teamMembers()
      },
      disableClose: true
    });

    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.snackBar.open('Performance goal assigned successfully.', 'Close', { duration: 3500 });
        this.refreshPerformance();
      }
    });
  }

  /**
   * Open Review Appraisal Dialog (Manager)
   */
  public onOpenReviewDialog(record: PerformanceDisplay): void {
    const emp = this.employees().find(e => String(e.employee_id) === String(record.employee_id));
    const currentEmp = this.currentEmployee();
    const reviewerId = currentEmp ? currentEmp.employee_id : 1;

    const ref = this.dialog.open(PerformanceReviewDialogComponent, {
      width: '640px',
      data: {
        performance: record,
        employee: emp,
        reviewerId: reviewerId
      },
      disableClose: true
    });

    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.snackBar.open('Performance appraisal recorded.', 'Close', { duration: 3500 });
        this.refreshPerformance();
      }
    });
  }

  public onTableAction(event: { action: string; row: PerformanceDisplay }): void {
    if (event.action === 'review') {
      this.onOpenReviewDialog(event.row);
    }
  }

  public resetFilters(): void {
    this.selectedPeriod.set('all');
    this.selectedRating.set('all');
    this.selectedEmployeeId.set('all');
  }

  private findMatchingEmployee(user: User | null, emps: Employee[]): Employee | undefined {
    if (!user) return undefined;
    const byEmail = emps.find(e => e.email.toLowerCase() === user.email.toLowerCase());
    if (byEmail) return byEmail;

    const [first, ...rest] = user.name.split(' ');
    const last = rest.join(' ');
    const byName = emps.find(e =>
      e.first_name.toLowerCase() === first.toLowerCase() &&
      e.last_name.toLowerCase() === last.toLowerCase()
    );
    if (byName) return byName;

    if (user.role === 'ADMIN') return emps.find(e => e.employee_id === 1);
    if (user.role === 'HR') return emps.find(e => e.employee_id === 2);
    if (user.role === 'MANAGER') return emps.find(e => e.employee_id === 4);
    return emps.find(e => e.employee_id === 5);
  }

  private enrichPerformance(perf: Performance, emps: Employee[], depts: Department[]): PerformanceDisplay {
    const emp = emps.find(e => String(e.employee_id) === String(perf.employee_id));
    const dept = emp ? depts.find(d => String(d.department_id) === String(emp.department_id)) : undefined;
    const rev = perf.reviewed_by ? emps.find(e => String(e.employee_id) === String(perf.reviewed_by)) : undefined;

    return {
      ...perf,
      employee_name: emp ? `${emp.first_name} ${emp.last_name}` : `EMP #${perf.employee_id}`,
      employee_code: emp?.employee_code || `EMP-${perf.employee_id}`,
      department_name: dept?.department_name || 'Operations',
      designation: emp?.designation || 'Staff Member',
      reviewer_name: rev ? `${rev.first_name} ${rev.last_name}` : (perf.reviewed_by ? `EMP #${perf.reviewed_by}` : undefined)
    };
  }
}
