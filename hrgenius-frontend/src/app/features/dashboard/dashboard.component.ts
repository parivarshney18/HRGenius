import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

import { AuthService } from '../../core/services/auth.service';
import { EmployeeService } from '../../core/services/employee.service';
import { DepartmentService } from '../../core/services/department.service';
import { JobService } from '../../core/services/job.service';
import { CandidateService } from '../../core/services/candidate.service';
import { LeaveService } from '../../core/services/leave.service';
import { AttendanceService } from '../../core/services/attendance.service';
import { PayrollService } from '../../core/services/payroll.service';
import { PerformanceService } from '../../core/services/performance.service';

import { Employee } from '../../core/models/employee.model';
import { Department } from '../../core/models/department.model';
import { Job } from '../../core/models/job.model';
import { Candidate } from '../../core/models/candidate.model';
import { Leave } from '../../core/models/leave.model';
import { Attendance } from '../../core/models/attendance.model';
import { Payroll } from '../../core/models/payroll.model';
import { Performance } from '../../core/models/performance.model';
import { RoleBadgeComponent } from '../../shared/components/role-badge/role-badge.component';

export function downloadCsv(filename: string, rows: Record<string, any>[]): void {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows.map(row => {
      return keys.map(k => {
        let cell = row[k] === null || row[k] === undefined ? '' : row[k];
        cell = cell instanceof Date ? cell.toLocaleString() : cell.toString().replace(/"/g, '""');
        if (cell.search(/("|,|\n)/g) >= 0) {
          cell = `"${cell}"`;
        }
        return cell;
      }).join(separator);
    }).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatTabsModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    BaseChartDirective,
    RoleBadgeComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  public readonly authService = inject(AuthService);
  private readonly employeeService = inject(EmployeeService);
  private readonly departmentService = inject(DepartmentService);
  private readonly jobService = inject(JobService);
  private readonly candidateService = inject(CandidateService);
  private readonly leaveService = inject(LeaveService);
  private readonly attendanceService = inject(AttendanceService);
  private readonly payrollService = inject(PayrollService);
  private readonly performanceService = inject(PerformanceService);
  private readonly snackBar = inject(MatSnackBar);

  public readonly currentUser = this.authService.currentUser;
  public readonly userRole = computed(() => this.currentUser()?.role || 'EMPLOYEE');
  public readonly isAdmin = computed(() => this.userRole() === 'ADMIN');
  public readonly isHR = computed(() => this.userRole() === 'HR');
  public readonly isManager = computed(() => this.userRole() === 'MANAGER');
  public readonly isEmployee = computed(() => this.userRole() === 'EMPLOYEE');

  public readonly isLoading = signal<boolean>(true);

  // Raw Datasets
  public readonly employees = signal<Employee[]>([]);
  public readonly departments = signal<Department[]>([]);
  public readonly jobs = signal<Job[]>([]);
  public readonly candidates = signal<Candidate[]>([]);
  public readonly leaves = signal<Leave[]>([]);
  public readonly attendances = signal<Attendance[]>([]);
  public readonly payrolls = signal<Payroll[]>([]);
  public readonly performances = signal<Performance[]>([]);

  // Mandatory KPI Cards
  public readonly totalEmployeesCount = computed(() => this.employees().length);
  public readonly newHiresCount = computed(() => {
    // Employees joined in 2026 or last 90 days
    return this.employees().filter(e => e.date_of_joining && e.date_of_joining.startsWith('2026') || e.date_of_joining.startsWith('2025')).length;
  });
  public readonly openPositionsCount = computed(() => {
    return this.jobs().reduce((sum, j) => sum + (j.openings || 1), 0);
  });
  public readonly pendingLeavesCount = computed(() => {
    return this.leaves().filter(l => l.leave_status === 'PENDING').length;
  });

  // Role-Specific Metric Computations
  public readonly myAttendanceToday = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    const user = this.currentUser();
    if (!user) return null;
    const emp = this.employees().find(e => e.email.toLowerCase() === user.email.toLowerCase());
    if (!emp) return null;
    return this.attendances().find(a => String(a.employee_id) === String(emp.employee_id) && a.attendance_date === today) || null;
  });

  public readonly myPendingLeaves = computed(() => {
    const user = this.currentUser();
    if (!user) return 0;
    const emp = this.employees().find(e => e.email.toLowerCase() === user.email.toLowerCase());
    if (!emp) return 0;
    return this.leaves().filter(l => String(l.employee_id) === String(emp.employee_id) && l.leave_status === 'PENDING').length;
  });

  public readonly teamMembersCount = computed(() => {
    const user = this.currentUser();
    if (!user) return 0;
    const emp = this.employees().find(e => e.email.toLowerCase() === user.email.toLowerCase());
    if (!emp) return 0;
    return this.employees().filter(e => e.manager_id && String(e.manager_id) === String(emp.employee_id)).length;
  });

  // Chart 1: Department-wise Headcount
  public readonly deptChartData = computed<ChartData<'doughnut', number[], string>>(() => {
    const emps = this.employees();
    const depts = this.departments();

    const counts: Record<string, number> = {};
    for (const d of depts) {
      counts[d.department_name] = emps.filter(e => String(e.department_id) === String(d.department_id)).length;
    }

    return {
      labels: Object.keys(counts),
      datasets: [
        {
          data: Object.values(counts),
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#64748b'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }
      ]
    };
  });

  public readonly deptChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } }
    }
  };

  // Chart 2: Attendance Summary
  public readonly attendanceChartData = computed<ChartData<'pie', number[], string>>(() => {
    const atts = this.attendances();
    const present = atts.filter(a => a.attendance_status === 'Present').length;
    const late = atts.filter(a => a.attendance_status === 'Late').length;
    const halfDay = atts.filter(a => a.attendance_status === 'Half-day').length;
    const absent = atts.filter(a => a.attendance_status === 'Absent').length;

    return {
      labels: ['Present', 'Late', 'Half-day', 'Absent'],
      datasets: [
        {
          data: [present, late, halfDay, absent],
          backgroundColor: ['#22c55e', '#f59e0b', '#a855f7', '#ef4444'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }
      ]
    };
  });

  public readonly attendanceChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } }
    }
  };

  // Chart 3: Leave Summary
  public readonly leaveChartData = computed<ChartData<'bar', number[], string>>(() => {
    const lvs = this.leaves();
    const approved = lvs.filter(l => l.leave_status === 'APPROVED').length;
    const pending = lvs.filter(l => l.leave_status === 'PENDING').length;
    const rejected = lvs.filter(l => l.leave_status === 'REJECTED').length;

    return {
      labels: ['Approved', 'Pending Approval', 'Rejected'],
      datasets: [
        {
          label: 'Leave Requests',
          data: [approved, pending, rejected],
          backgroundColor: ['#16a34a', '#d97706', '#dc2626'],
          borderRadius: 6
        }
      ]
    };
  });

  public readonly leaveChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } }
    }
  };

  // Chart 4: Recruitment Funnel
  public readonly recruitmentChartData = computed<ChartData<'bar', number[], string>>(() => {
    const cands = this.candidates();
    const applied = cands.filter(c => c.application_status === 'Applied').length;
    const shortlisted = cands.filter(c => c.application_status === 'Shortlisted').length;
    const interviewed = cands.filter(c => c.application_status === 'Interviewed').length;
    const selected = cands.filter(c => c.application_status === 'Selected').length;

    return {
      labels: ['1. Applied', '2. Shortlisted', '3. Interviewed', '4. Selected'],
      datasets: [
        {
          label: 'Candidates in Pipeline',
          data: [applied, shortlisted, interviewed, selected],
          backgroundColor: ['#38bdf8', '#818cf8', '#fbbf24', '#34d399'],
          borderRadius: 6
        }
      ]
    };
  });

  public readonly recruitmentChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: { beginAtZero: true, ticks: { stepSize: 1 } }
    }
  };

  // Chart 5: Payroll Summary (Gross vs Net)
  public readonly payrollChartData = computed<ChartData<'bar', number[], string>>(() => {
    const pays = this.payrolls();
    const augGross = pays.filter(p => p.payroll_month === '2026-08').reduce((s, p) => s + (p.gross_salary || 0), 0);
    const augNet = pays.filter(p => p.payroll_month === '2026-08').reduce((s, p) => s + (p.net_salary || 0), 0);
    const sepGross = pays.filter(p => p.payroll_month === '2026-09').reduce((s, p) => s + (p.gross_salary || 0), 0);
    const sepNet = pays.filter(p => p.payroll_month === '2026-09').reduce((s, p) => s + (p.net_salary || 0), 0);

    return {
      labels: ['August 2026', 'September 2026'],
      datasets: [
        {
          label: 'Gross Outlay ($)',
          data: [augGross, sepGross],
          backgroundColor: '#3b82f6',
          borderRadius: 6
        },
        {
          label: 'Net Payout ($)',
          data: [augNet, sepNet],
          backgroundColor: '#10b981',
          borderRadius: 6
        }
      ]
    };
  });

  public readonly payrollChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12 } }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `$${Number(value) / 1000}k`
        }
      }
    }
  };

  // Chart 6: Performance Rating Distribution
  public readonly performanceChartData = computed<ChartData<'bar', number[], string>>(() => {
    const perfs = this.performances();
    const star5 = perfs.filter(p => p.rating === 5).length;
    const star4 = perfs.filter(p => p.rating === 4).length;
    const star3 = perfs.filter(p => p.rating === 3).length;
    const star2 = perfs.filter(p => p.rating === 2).length;
    const star1 = perfs.filter(p => p.rating === 1).length;

    return {
      labels: ['5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'],
      datasets: [
        {
          label: 'Appraisal Ratings',
          data: [star5, star4, star3, star2, star1],
          backgroundColor: ['#eab308', '#f59e0b', '#fb923c', '#f87171', '#ef4444'],
          borderRadius: 6
        }
      ]
    };
  });

  public readonly performanceChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } }
    }
  };

  ngOnInit(): void {
    this.loadAllData();
  }

  public loadAllData(): void {
    this.isLoading.set(true);

    this.employeeService.getAll().subscribe(emps => {
      this.employees.set(emps);
    });

    this.departmentService.getAll().subscribe(depts => {
      this.departments.set(depts);
    });

    this.jobService.getAll().subscribe(jobs => {
      this.jobs.set(jobs);
    });

    this.candidateService.getAll().subscribe(cands => {
      this.candidates.set(cands);
    });

    this.leaveService.getAll().subscribe(lvs => {
      this.leaves.set(lvs);
    });

    this.attendanceService.getAll().subscribe(atts => {
      this.attendances.set(atts);
    });

    this.payrollService.getAll().subscribe(pays => {
      this.payrolls.set(pays);
    });

    this.performanceService.getAll().subscribe(perfs => {
      this.performances.set(perfs);
      this.isLoading.set(false);
    });
  }

  // CSV Exports
  public exportEmployees(): void {
    const list = this.employees().map(e => ({
      EmployeeID: e.employee_id,
      Code: e.employee_code,
      FirstName: e.first_name,
      LastName: e.last_name,
      Email: e.email,
      Phone: e.phone,
      DepartmentID: e.department_id,
      Designation: e.designation,
      DateOfJoining: e.date_of_joining,
      Status: e.status
    }));
    downloadCsv('HRGenius_Employees_Export', list);
    this.snackBar.open('Employees exported as CSV.', 'Close', { duration: 3000 });
  }

  public exportAttendance(): void {
    const list = this.attendances().map(a => ({
      AttendanceID: a.attendance_id,
      EmployeeID: a.employee_id,
      Date: a.attendance_date,
      CheckIn: a.check_in,
      CheckOut: a.check_out,
      Status: a.attendance_status,
      Hours: a.working_hours,
      Remarks: a.remarks
    }));
    downloadCsv('HRGenius_Attendance_Export', list);
    this.snackBar.open('Attendance records exported as CSV.', 'Close', { duration: 3000 });
  }

  public exportLeaves(): void {
    const list = this.leaves().map(l => ({
      LeaveID: l.leave_id,
      EmployeeID: l.employee_id,
      Type: l.leave_type,
      Start: l.start_date,
      End: l.end_date,
      Days: l.number_of_days,
      Status: l.leave_status,
      AppliedOn: l.applied_date,
      ApprovedBy: l.approved_by,
      Reason: l.reason
    }));
    downloadCsv('HRGenius_Leaves_Export', list);
    this.snackBar.open('Leave records exported as CSV.', 'Close', { duration: 3000 });
  }

  public exportPayroll(): void {
    const list = this.payrolls().map(p => ({
      PayrollID: p.payroll_id,
      EmployeeID: p.employee_id,
      Month: p.payroll_month,
      Basic: p.basic_salary,
      Allowances: p.allowances,
      Bonus: p.bonus,
      Gross: p.gross_salary,
      Deductions: p.deductions,
      Tax: p.tax,
      Net: p.net_salary,
      Status: p.payroll_status,
      PaymentDate: p.payment_date
    }));
    downloadCsv('HRGenius_Payroll_Export', list);
    this.snackBar.open('Payroll records exported as CSV.', 'Close', { duration: 3000 });
  }

  public exportPerformance(): void {
    const list = this.performances().map(p => ({
      PerformanceID: p.performance_id,
      EmployeeID: p.employee_id,
      Period: p.review_period,
      Goal: p.goal,
      Achievement: p.achievement,
      Rating: p.rating,
      Feedback: p.feedback,
      ReviewedBy: p.reviewed_by,
      Status: p.performance_status
    }));
    downloadCsv('HRGenius_Performance_Export', list);
    this.snackBar.open('Performance appraisals exported as CSV.', 'Close', { duration: 3000 });
  }
}
