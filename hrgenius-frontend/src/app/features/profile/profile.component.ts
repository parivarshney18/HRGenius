import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { EmployeeService } from '../../core/services/employee.service';
import { DepartmentService } from '../../core/services/department.service';
import { PayrollService } from '../../core/services/payroll.service';
import { Employee } from '../../core/models/employee.model';
import { Department } from '../../core/models/department.model';
import { Payroll } from '../../core/models/payroll.model';
import { User } from '../../core/models/user.model';
import { PayslipDetailDialogComponent, PayslipDetailDialogData } from '../payroll/payslip-detail-dialog/payslip-detail-dialog.component';

export interface SalaryRecordDisplay extends Payroll {
  deductions_total: number;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDividerModule,
    MatTableModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly employeeService = inject(EmployeeService);
  private readonly departmentService = inject(DepartmentService);
  private readonly payrollService = inject(PayrollService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  public readonly router = inject(Router);

  // Current logged in user & role
  public readonly currentUser = this.authService.currentUser;
  public readonly userRole = computed(() => this.currentUser()?.role || 'EMPLOYEE');
  public readonly isAdmin = computed(() => this.userRole() === 'ADMIN');
  public readonly isHR = computed(() => this.userRole() === 'HR');
  public readonly isManager = computed(() => this.userRole() === 'MANAGER');
  public readonly isEmployeeOnly = computed(() => this.userRole() === 'EMPLOYEE');

  // Can select another employee? Only ADMIN and HR can switch profile view; EMPLOYEES can only see their own.
  public readonly canSelectEmployee = computed(() => this.isAdmin() || this.isHR());

  // Master Data
  public readonly allEmployees = signal<Employee[]>([]);
  public readonly allDepartments = signal<Department[]>([]);

  // Selected Profile
  public readonly selectedEmployee = signal<Employee | null>(null);
  public readonly department = signal<Department | null>(null);
  public readonly manager = signal<Employee | null>(null);
  public readonly salaryHistory = signal<SalaryRecordDisplay[]>([]);
  public readonly isLoading = signal<boolean>(true);

  // Selected employee ID for dropdown (for HR/ADMIN)
  public selectedEmployeeId: string | number = '';

  // Table columns for salary history
  public readonly salaryColumns: string[] = [
    'payroll_month',
    'basic_salary',
    'allowances',
    'bonus',
    'gross_salary',
    'deductions',
    'net_salary',
    'payroll_status',
    'payment_date',
    'actions'
  ];

  // Calculated Compensation Summary
  public readonly compensationSummary = computed(() => {
    const records = this.salaryHistory();
    if (!records || records.length === 0) {
      return {
        latestGross: 0,
        latestNet: 0,
        totalPaid: 0,
        recordCount: 0,
        latestMonth: 'N/A'
      };
    }
    const latest = records[0];
    const totalPaid = records
      .filter(r => r.payroll_status === 'Paid')
      .reduce((sum, r) => sum + (Number(r.net_salary) || 0), 0);

    return {
      latestGross: latest.gross_salary || 0,
      latestNet: latest.net_salary || 0,
      totalPaid,
      recordCount: records.length,
      latestMonth: latest.payroll_month || 'N/A'
    };
  });

  ngOnInit(): void {
    this.loadInitialData();
  }

  public loadInitialData(): void {
    this.isLoading.set(true);

    this.departmentService.getAll().subscribe({
      next: depts => {
        this.allDepartments.set(depts);

        this.employeeService.getAll().subscribe({
          next: emps => {
            this.allEmployees.set(emps);

            const user = this.currentUser();
            const matchedEmp = this.findMatchingEmployee(user, emps);

            if (matchedEmp) {
              this.selectedEmployeeId = matchedEmp.employee_id;
              this.loadProfile(matchedEmp);
            } else if (emps.length > 0) {
              this.selectedEmployeeId = emps[0].employee_id;
              this.loadProfile(emps[0]);
            } else {
              this.isLoading.set(false);
            }
          },
          error: () => {
            this.isLoading.set(false);
            this.snackBar.open('Failed to load employee directory', 'Close', { duration: 3000 });
          }
        });
      },
      error: () => {
        this.isLoading.set(false);
        this.snackBar.open('Failed to load department records', 'Close', { duration: 3000 });
      }
    });
  }

  public onEmployeeChange(empId: string | number): void {
    if (!this.canSelectEmployee()) return;
    const emp = this.allEmployees().find(e => String(e.employee_id) === String(empId));
    if (emp) {
      this.loadProfile(emp);
    }
  }

  public loadProfile(emp: Employee): void {
    this.selectedEmployee.set(emp);
    this.selectedEmployeeId = emp.employee_id;

    // Find Department
    const dept = this.allDepartments().find(d => String(d.department_id) === String(emp.department_id));
    this.department.set(dept || null);

    // Find Manager
    if (emp.manager_id) {
      const mgr = this.allEmployees().find(e => String(e.employee_id) === String(emp.manager_id));
      this.manager.set(mgr || null);
    } else {
      this.manager.set(null);
    }

    // Load Salary History from PayrollService
    this.payrollService.getByEmployee(emp.employee_id).subscribe({
      next: records => {
        const sorted = [...records]
          .sort((a, b) => b.payroll_month.localeCompare(a.payroll_month))
          .map(r => ({
            ...r,
            deductions_total: (Number(r.deductions) || 0) + (Number(r.tax) || 0)
          }));

        this.salaryHistory.set(sorted);
        this.isLoading.set(false);
      },
      error: () => {
        this.salaryHistory.set([]);
        this.isLoading.set(false);
      }
    });
  }

  public openPayslip(payroll: Payroll): void {
    const dialogData: PayslipDetailDialogData = {
      payroll,
      employee: this.selectedEmployee() || undefined,
      department: this.department() || undefined
    };

    this.dialog.open(PayslipDetailDialogComponent, {
      width: '760px',
      maxWidth: '95vw',
      data: dialogData
    });
  }

  public onPrint(): void {
    window.print();
  }

  public goToPayslips(): void {
    this.router.navigate(['/payroll']);
  }

  public goToLeaves(): void {
    this.router.navigate(['/leaves']);
  }

  private findMatchingEmployee(user: User | null, emps: Employee[]): Employee | undefined {
    if (!user) return emps[0];

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
}
