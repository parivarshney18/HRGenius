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
import { LeaveService } from '../../core/services/leave.service';
import { EmployeeService } from '../../core/services/employee.service';
import { DepartmentService } from '../../core/services/department.service';
import { AuthService } from '../../core/services/auth.service';
import { Leave } from '../../core/models/leave.model';
import { Employee } from '../../core/models/employee.model';
import { Department } from '../../core/models/department.model';
import { User } from '../../core/models/user.model';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { TableColumn, TableAction } from '../../shared/components/data-table/data-table.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { LeaveApplyDialogComponent } from './leave-apply-dialog/leave-apply-dialog.component';

export interface LeaveDisplay extends Leave {
  employee_name?: string;
  employee_code?: string;
  department_name?: string;
  designation?: string;
  approver_name?: string;
}

@Component({
  selector: 'app-leaves',
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
  templateUrl: './leaves.component.html',
  styleUrl: './leaves.component.scss'
})
export class LeavesComponent implements OnInit {
  private readonly leaveService = inject(LeaveService);
  private readonly employeeService = inject(EmployeeService);
  private readonly departmentService = inject(DepartmentService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  // User & Role Context
  public readonly currentUser = this.authService.currentUser;
  public readonly userRole = computed(() => this.currentUser()?.role || 'EMPLOYEE');
  public readonly isAdmin = computed(() => this.userRole() === 'ADMIN');
  public readonly isHR = computed(() => this.userRole() === 'HR');
  public readonly isManager = computed(() => this.userRole() === 'MANAGER');
  public readonly isEmployeeOnly = computed(() => this.userRole() === 'EMPLOYEE');

  public readonly canManageAll = computed(() => this.isAdmin() || this.isHR());
  public readonly canApprove = computed(() => this.isAdmin() || this.isHR() || this.isManager());

  // Master Data
  public readonly currentEmployee = signal<Employee | null>(null);
  public readonly employees = signal<Employee[]>([]);
  public readonly departments = signal<Department[]>([]);

  // Datasets
  public readonly allLeaves = signal<LeaveDisplay[]>([]);
  public readonly pendingApprovals = signal<LeaveDisplay[]>([]);
  public readonly myLeaves = signal<LeaveDisplay[]>([]);
  public readonly isLoading = signal<boolean>(true);

  // Filters
  public readonly selectedStatus = signal<string>('all');
  public readonly selectedType = signal<string>('all');
  public readonly selectedEmployeeId = signal<string>('all');

  // Status badges config
  public readonly statusBadgeConfig = {
    'PENDING': { bg: '#fef3c7', color: '#b45309', border: '#fcd34d' },
    'APPROVED': { bg: '#dcfce7', color: '#15803d', border: '#86efac' },
    'REJECTED': { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' }
  };

  // Filtered all leaves (for HR / ADMIN)
  public readonly filteredAllLeaves = computed(() => {
    let list = this.allLeaves();
    const st = this.selectedStatus();
    const tp = this.selectedType();
    const emp = this.selectedEmployeeId();

    if (st && st !== 'all') {
      list = list.filter(l => l.leave_status === st);
    }
    if (tp && tp !== 'all') {
      list = list.filter(l => l.leave_type === tp);
    }
    if (emp && emp !== 'all') {
      list = list.filter(l => String(l.employee_id) === String(emp));
    }
    return list;
  });

  // KPI Metrics
  public readonly metrics = computed(() => {
    const list = this.canManageAll() ? this.allLeaves() : this.myLeaves();
    const total = list.length;
    const pending = list.filter(l => l.leave_status === 'PENDING').length;
    const approved = list.filter(l => l.leave_status === 'APPROVED').length;
    const rejected = list.filter(l => l.leave_status === 'REJECTED').length;
    return { total, pending, approved, rejected };
  });

  // Columns for My Leave History
  public readonly myColumns: TableColumn<LeaveDisplay>[] = [
    {
      key: 'leave_type',
      header: 'Leave Type',
      sortable: true,
      width: '160px'
    },
    {
      key: 'start_date',
      header: 'Start Date',
      sortable: true,
      width: '120px'
    },
    {
      key: 'end_date',
      header: 'End Date',
      sortable: true,
      width: '120px'
    },
    {
      key: 'number_of_days',
      header: 'Days',
      sortable: true,
      width: '90px',
      cell: (r) => `${r.number_of_days} d`
    },
    {
      key: 'reason',
      header: 'Reason',
      sortable: true
    },
    {
      key: 'applied_date',
      header: 'Applied On',
      sortable: true,
      width: '120px'
    },
    {
      key: 'leave_status',
      header: 'Status',
      type: 'badge',
      sortable: true,
      width: '130px',
      badgeConfig: this.statusBadgeConfig
    }
  ];

  // Columns for All Leaves (HR / ADMIN)
  public readonly allColumns: TableColumn<LeaveDisplay>[] = [
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
      width: '170px'
    },
    {
      key: 'leave_type',
      header: 'Type',
      sortable: true,
      width: '140px'
    },
    {
      key: 'start_date',
      header: 'Start',
      sortable: true,
      width: '110px'
    },
    {
      key: 'end_date',
      header: 'End',
      sortable: true,
      width: '110px'
    },
    {
      key: 'number_of_days',
      header: 'Days',
      sortable: true,
      width: '80px',
      cell: (r) => `${r.number_of_days} d`
    },
    {
      key: 'leave_status',
      header: 'Status',
      type: 'badge',
      sortable: true,
      width: '130px',
      badgeConfig: this.statusBadgeConfig
    },
    {
      key: 'reason',
      header: 'Reason',
      sortable: true
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

        this.refreshLeaves();
      });
    });
  }

  public refreshLeaves(): void {
    const emp = this.currentEmployee();
    const emps = this.employees();
    const depts = this.departments();

    this.leaveService.getAll().subscribe(all => {
      const enriched = all.map(l => this.enrichLeave(l, emps, depts));
      this.allLeaves.set(enriched);

      // Pending Approvals calculation
      if (this.canManageAll()) {
        // HR/Admin see all pending
        this.pendingApprovals.set(enriched.filter(l => l.leave_status === 'PENDING'));
      } else if (this.isManager() && emp) {
        // Manager sees pending for direct reports
        const directReportIds = new Set(
          emps.filter(e => e.manager_id && String(e.manager_id) === String(emp.employee_id)).map(e => String(e.employee_id))
        );
        this.pendingApprovals.set(enriched.filter(l => l.leave_status === 'PENDING' && directReportIds.has(String(l.employee_id))));
      } else {
        this.pendingApprovals.set([]);
      }

      // My Leaves
      if (emp) {
        const my = enriched.filter(l => String(l.employee_id) === String(emp.employee_id));
        this.myLeaves.set(my);
      }

      this.isLoading.set(false);
    });
  }

  /**
   * Open Leave Application Dialog
   */
  public onOpenApplyDialog(): void {
    const emp = this.currentEmployee();
    if (!emp) {
      this.snackBar.open('No active employee profile linked to current account.', 'Close', { duration: 3000 });
      return;
    }

    const ref = this.dialog.open(LeaveApplyDialogComponent, {
      width: '580px',
      data: { employee: emp },
      disableClose: true
    });

    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.snackBar.open('Leave application submitted successfully.', 'Close', { duration: 3500 });
        this.refreshLeaves();
      }
    });
  }

  /**
   * Approve a leave request
   */
  public onApprove(leave: LeaveDisplay): void {
    const approver = this.currentEmployee()?.employee_id || 1;
    this.leaveService.approve(leave.leave_id, approver).subscribe({
      next: () => {
        this.snackBar.open(`Leave request for ${leave.employee_name} approved.`, 'Close', { duration: 3000 });
        this.refreshLeaves();
      },
      error: (err) => {
        this.snackBar.open(err?.message || 'Failed to approve leave.', 'Close', { duration: 4000 });
      }
    });
  }

  /**
   * Reject a leave request
   */
  public onReject(leave: LeaveDisplay): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Reject Leave Request',
        message: `Are you sure you want to reject the leave request for ${leave.employee_name} (${leave.start_date} to ${leave.end_date})?`,
        confirmText: 'Reject Leave',
        confirmColor: 'warn'
      }
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        const approver = this.currentEmployee()?.employee_id || 1;
        this.leaveService.reject(leave.leave_id, approver).subscribe({
          next: () => {
            this.snackBar.open(`Leave request rejected.`, 'Close', { duration: 3000 });
            this.refreshLeaves();
          },
          error: (err) => {
            this.snackBar.open(err?.message || 'Failed to reject leave.', 'Close', { duration: 4000 });
          }
        });
      }
    });
  }

  public resetFilters(): void {
    this.selectedStatus.set('all');
    this.selectedType.set('all');
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

  private enrichLeave(leave: Leave, emps: Employee[], depts: Department[]): LeaveDisplay {
    const emp = emps.find(e => String(e.employee_id) === String(leave.employee_id));
    const dept = emp ? depts.find(d => String(d.department_id) === String(emp.department_id)) : undefined;
    const approver = leave.approved_by ? emps.find(e => String(e.employee_id) === String(leave.approved_by)) : undefined;

    return {
      ...leave,
      employee_name: emp ? `${emp.first_name} ${emp.last_name}` : `EMP #${leave.employee_id}`,
      employee_code: emp?.employee_code || `EMP-${leave.employee_id}`,
      department_name: dept?.department_name || 'Operations',
      designation: emp?.designation || 'Staff',
      approver_name: approver ? `${approver.first_name} ${approver.last_name}` : (leave.approved_by ? `EMP #${leave.approved_by}` : undefined)
    };
  }
}
