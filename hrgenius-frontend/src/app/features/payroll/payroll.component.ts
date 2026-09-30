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
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PayrollService } from '../../core/services/payroll.service';
import { EmployeeService } from '../../core/services/employee.service';
import { DepartmentService } from '../../core/services/department.service';
import { AuthService } from '../../core/services/auth.service';
import { Payroll } from '../../core/models/payroll.model';
import { Employee } from '../../core/models/employee.model';
import { Department } from '../../core/models/department.model';
import { User } from '../../core/models/user.model';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { TableColumn, TableAction } from '../../shared/components/data-table/data-table.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { PayslipDetailDialogComponent } from './payslip-detail-dialog/payslip-detail-dialog.component';
import { PayrollGenerateDialogComponent } from './payroll-generate-dialog/payroll-generate-dialog.component';

export interface PayrollDisplay extends Payroll {
  employee_name?: string;
  employee_code?: string;
  department_name?: string;
  designation?: string;
}

@Component({
  selector: 'app-payroll',
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
    MatMenuModule,
    MatProgressSpinnerModule,
    DataTableComponent
  ],
  templateUrl: './payroll.component.html',
  styleUrl: './payroll.component.scss'
})
export class PayrollComponent implements OnInit {
  private readonly payrollService = inject(PayrollService);
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
  public readonly isEmployeeOnly = computed(() => this.userRole() === 'EMPLOYEE');
  public readonly canManageAll = computed(() => this.isAdmin() || this.isHR());

  // Master Data
  public readonly currentEmployee = signal<Employee | null>(null);
  public readonly employees = signal<Employee[]>([]);
  public readonly departments = signal<Department[]>([]);

  // Datasets
  public readonly allPayrolls = signal<PayrollDisplay[]>([]);
  public readonly myPayrolls = signal<PayrollDisplay[]>([]);
  public readonly isLoading = signal<boolean>(true);

  // Filters for HR/Admin
  public readonly selectedMonth = signal<string>('2026-09');
  public readonly selectedStatus = signal<string>('all');
  public readonly selectedEmployeeId = signal<string>('all');

  // Status badges config
  public readonly statusBadgeConfig = {
    'Draft': { bg: '#fef3c7', color: '#b45309', border: '#fcd34d' },
    'Processed': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    'Paid': { bg: '#dcfce7', color: '#15803d', border: '#86efac' }
  };

  // Filtered payrolls
  public readonly filteredAllPayrolls = computed(() => {
    let list = this.allPayrolls();
    const m = this.selectedMonth();
    const s = this.selectedStatus();
    const e = this.selectedEmployeeId();

    if (m) {
      list = list.filter(p => p.payroll_month === m);
    }
    if (s && s !== 'all') {
      list = list.filter(p => p.payroll_status === s);
    }
    if (e && e !== 'all') {
      list = list.filter(p => String(p.employee_id) === String(e));
    }
    return list;
  });

  // KPI Metrics
  public readonly metrics = computed(() => {
    const list = this.canManageAll() ? this.filteredAllPayrolls() : this.myPayrolls();
    const totalCount = list.length;
    const totalGross = list.reduce((sum, p) => sum + (p.gross_salary || 0), 0);
    const totalNet = list.reduce((sum, p) => sum + (p.net_salary || 0), 0);
    const totalTax = list.reduce((sum, p) => sum + (p.tax || 0), 0);
    const paidCount = list.filter(p => p.payroll_status === 'Paid').length;
    const draftCount = list.filter(p => p.payroll_status === 'Draft').length;

    return { totalCount, totalGross, totalNet, totalTax, paidCount, draftCount };
  });

  // Table Columns for All Payrolls
  public readonly allColumns: TableColumn<PayrollDisplay>[] = [
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
      key: 'payroll_month',
      header: 'Month',
      sortable: true,
      width: '100px'
    },
    {
      key: 'basic_salary',
      header: 'Basic ($)',
      sortable: true,
      width: '110px',
      cell: (r) => `$${r.basic_salary?.toLocaleString()}`
    },
    {
      key: 'gross_salary',
      header: 'Gross Pay',
      sortable: true,
      width: '120px',
      cell: (r) => `$${r.gross_salary?.toLocaleString()}`
    },
    {
      key: 'deductions',
      header: 'Deductions',
      sortable: true,
      width: '110px',
      cell: (r) => `$${(r.deductions + r.tax)?.toLocaleString()}`
    },
    {
      key: 'net_salary',
      header: 'Net Salary',
      sortable: true,
      width: '130px',
      cell: (r) => `$${r.net_salary?.toLocaleString()}`
    },
    {
      key: 'payroll_status',
      header: 'Status',
      type: 'badge',
      sortable: true,
      width: '120px',
      badgeConfig: this.statusBadgeConfig
    },
    {
      key: 'payment_date',
      header: 'Paid Date',
      sortable: true,
      width: '120px',
      cell: (r) => r.payment_date || '--'
    }
  ];

  // Actions for All Payrolls table
  public readonly hrActions: TableAction<PayrollDisplay>[] = [
    {
      name: 'view',
      icon: 'receipt',
      color: 'primary',
      tooltip: 'View Payslip & Print'
    },
    {
      name: 'process',
      icon: 'sync_alt',
      tooltip: 'Mark as Processed',
      visible: (r) => r.payroll_status === 'Draft'
    },
    {
      name: 'pay',
      icon: 'paid',
      color: 'accent',
      tooltip: 'Disburse & Mark as Paid',
      visible: (r) => r.payroll_status !== 'Paid'
    },
    {
      name: 'delete',
      icon: 'delete',
      color: 'warn',
      tooltip: 'Delete Draft',
      visible: (r) => r.payroll_status === 'Draft'
    }
  ];

  // Columns for My Payslips
  public readonly myColumns: TableColumn<PayrollDisplay>[] = [
    {
      key: 'payroll_month',
      header: 'Pay Period',
      sortable: true,
      width: '130px'
    },
    {
      key: 'gross_salary',
      header: 'Gross Salary',
      sortable: true,
      width: '140px',
      cell: (r) => `$${r.gross_salary?.toLocaleString()}`
    },
    {
      key: 'deductions',
      header: 'Total Withholdings',
      sortable: true,
      width: '160px',
      cell: (r) => `$${(r.deductions + r.tax)?.toLocaleString()}`
    },
    {
      key: 'net_salary',
      header: 'Net Take-Home',
      sortable: true,
      width: '150px',
      cell: (r) => `$${r.net_salary?.toLocaleString()}`
    },
    {
      key: 'payment_date',
      header: 'Disbursement Date',
      sortable: true,
      width: '150px',
      cell: (r) => r.payment_date || 'In Progress'
    },
    {
      key: 'payroll_status',
      header: 'Status',
      type: 'badge',
      sortable: true,
      width: '130px',
      badgeConfig: this.statusBadgeConfig
    }
  ];

  public readonly myActions: TableAction<PayrollDisplay>[] = [
    {
      name: 'view',
      icon: 'receipt_long',
      color: 'primary',
      tooltip: 'View Statement & Print / PDF'
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

        this.refreshPayrolls();
      });
    });
  }

  public refreshPayrolls(): void {
    const emp = this.currentEmployee();
    const emps = this.employees();
    const depts = this.departments();

    this.payrollService.getAll().subscribe(all => {
      const enriched = all.map(p => this.enrichPayroll(p, emps, depts));
      this.allPayrolls.set(enriched);

      if (emp) {
        const my = enriched.filter(p => String(p.employee_id) === String(emp.employee_id));
        this.myPayrolls.set(my);
      }

      this.isLoading.set(false);
    });
  }

  /**
   * Open Generate Payroll Dialog
   */
  public onOpenGenerateDialog(): void {
    const ref = this.dialog.open(PayrollGenerateDialogComponent, {
      width: '620px',
      disableClose: true
    });

    ref.afterClosed().subscribe((res) => {
      if (res && res.length > 0) {
        this.snackBar.open(`Successfully generated payroll records for ${res.length} employee(s).`, 'Close', {
          duration: 3500
        });
        this.refreshPayrolls();
      }
    });
  }

  /**
   * View Payslip Detail in Modal
   */
  public onViewPayslip(row: PayrollDisplay): void {
    const emp = this.employees().find(e => String(e.employee_id) === String(row.employee_id));
    const dept = this.departments().find(d => String(d.department_id) === String(emp?.department_id));

    this.dialog.open(PayslipDetailDialogComponent, {
      width: '840px',
      data: {
        payroll: row,
        employee: emp,
        department: dept
      }
    });
  }

  /**
   * Handle table action clicks
   */
  public onTableAction(event: { action: string; row: PayrollDisplay }): void {
    if (event.action === 'view') {
      this.onViewPayslip(event.row);
    } else if (event.action === 'process') {
      this.payrollService.updateStatus(event.row.payroll_id, 'Processed').subscribe({
        next: () => {
          this.snackBar.open(`Payroll for ${event.row.employee_name} marked as Processed.`, 'Close', { duration: 3000 });
          this.refreshPayrolls();
        }
      });
    } else if (event.action === 'pay') {
      const today = new Date().toISOString().split('T')[0];
      this.payrollService.updateStatus(event.row.payroll_id, 'Paid', today).subscribe({
        next: () => {
          this.snackBar.open(`Disbursement recorded: Paid $${event.row.net_salary} to ${event.row.employee_name}.`, 'Close', {
            duration: 3500
          });
          this.refreshPayrolls();
        }
      });
    } else if (event.action === 'delete') {
      const ref = this.dialog.open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Payroll Record',
          message: `Are you sure you want to delete the draft payroll record for ${event.row.employee_name} (${event.row.payroll_month})?`,
          confirmText: 'Delete Draft',
          confirmColor: 'warn'
        }
      });

      ref.afterClosed().subscribe((confirmed) => {
        if (confirmed) {
          this.payrollService.delete(event.row.payroll_id).subscribe({
            next: () => {
              this.snackBar.open('Payroll record deleted.', 'Close', { duration: 3000 });
              this.refreshPayrolls();
            }
          });
        }
      });
    }
  }

  public resetFilters(): void {
    this.selectedMonth.set('2026-09');
    this.selectedStatus.set('all');
    this.selectedEmployeeId.set('all');
  }

  public clearMonthFilter(): void {
    this.selectedMonth.set('');
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

  private enrichPayroll(payroll: Payroll, emps: Employee[], depts: Department[]): PayrollDisplay {
    const emp = emps.find(e => String(e.employee_id) === String(payroll.employee_id));
    const dept = emp ? depts.find(d => String(d.department_id) === String(emp.department_id)) : undefined;

    return {
      ...payroll,
      employee_name: emp ? `${emp.first_name} ${emp.last_name}` : `EMP #${payroll.employee_id}`,
      employee_code: emp?.employee_code || `EMP-${payroll.employee_id}`,
      department_name: dept?.department_name || 'Operations',
      designation: emp?.designation || 'Staff Member'
    };
  }
}
