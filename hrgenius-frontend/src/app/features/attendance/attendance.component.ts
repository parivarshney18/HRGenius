import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { AttendanceService } from '../../core/services/attendance.service';
import { EmployeeService } from '../../core/services/employee.service';
import { DepartmentService } from '../../core/services/department.service';
import { AuthService } from '../../core/services/auth.service';
import { Attendance } from '../../core/models/attendance.model';
import { Employee } from '../../core/models/employee.model';
import { Department } from '../../core/models/department.model';
import { User } from '../../core/models/user.model';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { TableColumn, TableAction } from '../../shared/components/data-table/data-table.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { AttendanceRecordDialogComponent } from './attendance-record-dialog/attendance-record-dialog.component';

export interface AttendanceDisplay extends Attendance {
  employee_name?: string;
  employee_code?: string;
  department_name?: string;
  designation?: string;
}

@Component({
  selector: 'app-attendance',
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
    MatProgressSpinnerModule,
    MatChipsModule,
    DataTableComponent
  ],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.scss'
})
export class AttendanceComponent implements OnInit, OnDestroy {
  private readonly attendanceService = inject(AttendanceService);
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
  public readonly canViewTeam = computed(() => this.isAdmin() || this.isHR() || this.isManager());

  // Current logged in employee identity
  public readonly currentEmployee = signal<Employee | null>(null);

  // Raw dataset signals
  public readonly allRecords = signal<AttendanceDisplay[]>([]);
  public readonly teamRecords = signal<AttendanceDisplay[]>([]);
  public readonly myRecords = signal<AttendanceDisplay[]>([]);
  public readonly employees = signal<Employee[]>([]);
  public readonly departments = signal<Department[]>([]);

  // Today's punch card state
  public readonly todayRecord = signal<Attendance | null>(null);
  public readonly isPunching = signal<boolean>(false);
  public readonly punchRemarks = signal<string>('');
  public readonly currentTime = signal<Date>(new Date());
  private clockTimer: any = null;

  // Loading state
  public readonly isLoading = signal<boolean>(true);

  // Filters for HR/Admin All Attendance View
  public readonly selectedDate = signal<string>('');
  public readonly selectedEmployeeId = signal<string>('all');
  public readonly selectedStatus = signal<string>('all');

  // Badge configuration for status styling
  public readonly statusBadgeConfig = {
    'Present': { bg: '#dcfce7', color: '#15803d', border: '#86efac' },
    'Late': { bg: '#fef3c7', color: '#b45309', border: '#fcd34d' },
    'Half-day': { bg: '#ede9fe', color: '#6d28d9', border: '#c4b5fd' },
    'Absent': { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' }
  };

  // Filtered dataset for HR/Admin All Records Table
  public readonly filteredAllRecords = computed(() => {
    let list = this.allRecords();
    const date = this.selectedDate();
    const empId = this.selectedEmployeeId();
    const status = this.selectedStatus();

    if (date) {
      list = list.filter(r => r.attendance_date === date);
    }
    if (empId && empId !== 'all') {
      list = list.filter(r => String(r.employee_id) === String(empId));
    }
    if (status && status !== 'all') {
      list = list.filter(r => r.attendance_status === status);
    }
    return list;
  });

  // Summary Metrics based on currently active view
  public readonly metrics = computed(() => {
    const list = this.canManageAll()
      ? this.filteredAllRecords()
      : (this.isManager() ? this.teamRecords() : this.myRecords());

    const total = list.length;
    const present = list.filter(r => r.attendance_status === 'Present').length;
    const late = list.filter(r => r.attendance_status === 'Late').length;
    const halfDay = list.filter(r => r.attendance_status === 'Half-day').length;
    const absent = list.filter(r => r.attendance_status === 'Absent').length;

    const completedWithHours = list.filter(r => r.working_hours !== null && r.working_hours !== undefined && r.working_hours > 0);
    const avgHours = completedWithHours.length > 0
      ? Math.round((completedWithHours.reduce((acc, r) => acc + (r.working_hours || 0), 0) / completedWithHours.length) * 10) / 10
      : 0;

    return { total, present, late, halfDay, absent, avgHours };
  });

  // Table Columns for All Attendance Records (HR/Admin)
  public readonly allColumns: TableColumn<AttendanceDisplay>[] = [
    {
      key: 'employee_name',
      header: 'Employee',
      sortable: true,
      width: '220px',
      cell: (r) => `${r.employee_name || 'EMP #' + r.employee_id} (${r.employee_code || '---'})`
    },
    {
      key: 'department_name',
      header: 'Department',
      sortable: true,
      width: '180px',
      cell: (r) => r.department_name || 'General'
    },
    {
      key: 'attendance_date',
      header: 'Date',
      sortable: true,
      width: '120px'
    },
    {
      key: 'check_in',
      header: 'Check In',
      sortable: true,
      width: '110px',
      cell: (r) => r.check_in || '--:--'
    },
    {
      key: 'check_out',
      header: 'Check Out',
      sortable: true,
      width: '110px',
      cell: (r) => r.check_out || '--:--'
    },
    {
      key: 'working_hours',
      header: 'Working Hours',
      sortable: true,
      width: '130px',
      cell: (r) => (r.working_hours !== null && r.working_hours !== undefined) ? `${r.working_hours} hrs` : '--'
    },
    {
      key: 'attendance_status',
      header: 'Status',
      type: 'badge',
      sortable: true,
      width: '120px',
      badgeConfig: this.statusBadgeConfig
    },
    {
      key: 'remarks',
      header: 'Remarks',
      sortable: true,
      cell: (r) => r.remarks || '---'
    }
  ];

  // Table Actions for HR/Admin
  public readonly hrActions: TableAction<AttendanceDisplay>[] = [
    {
      name: 'edit',
      icon: 'edit',
      color: 'primary',
      tooltip: 'Edit Attendance'
    },
    {
      name: 'delete',
      icon: 'delete',
      color: 'warn',
      tooltip: 'Delete Record'
    }
  ];

  // Table Columns for Team Attendance (Manager)
  public readonly teamColumns: TableColumn<AttendanceDisplay>[] = [
    {
      key: 'employee_name',
      header: 'Team Member',
      sortable: true,
      width: '220px',
      cell: (r) => `${r.employee_name || 'EMP #' + r.employee_id} (${r.employee_code || '---'})`
    },
    {
      key: 'designation',
      header: 'Designation',
      sortable: true,
      width: '180px',
      cell: (r) => r.designation || 'Staff'
    },
    {
      key: 'attendance_date',
      header: 'Date',
      sortable: true,
      width: '120px'
    },
    {
      key: 'check_in',
      header: 'Check In',
      sortable: true,
      width: '110px',
      cell: (r) => r.check_in || '--:--'
    },
    {
      key: 'check_out',
      header: 'Check Out',
      sortable: true,
      width: '110px',
      cell: (r) => r.check_out || '--:--'
    },
    {
      key: 'working_hours',
      header: 'Working Hours',
      sortable: true,
      width: '130px',
      cell: (r) => (r.working_hours !== null && r.working_hours !== undefined) ? `${r.working_hours} hrs` : '--'
    },
    {
      key: 'attendance_status',
      header: 'Status',
      type: 'badge',
      sortable: true,
      width: '120px',
      badgeConfig: this.statusBadgeConfig
    },
    {
      key: 'remarks',
      header: 'Remarks',
      sortable: true,
      cell: (r) => r.remarks || '---'
    }
  ];

  // Table Columns for My Attendance History (Employee/Self)
  public readonly myColumns: TableColumn<AttendanceDisplay>[] = [
    {
      key: 'attendance_date',
      header: 'Shift Date',
      sortable: true,
      width: '140px'
    },
    {
      key: 'check_in',
      header: 'Punch In',
      sortable: true,
      width: '120px',
      cell: (r) => r.check_in || '--:--'
    },
    {
      key: 'check_out',
      header: 'Punch Out',
      sortable: true,
      width: '120px',
      cell: (r) => r.check_out || '--:--'
    },
    {
      key: 'working_hours',
      header: 'Hours Logged',
      sortable: true,
      width: '130px',
      cell: (r) => (r.working_hours !== null && r.working_hours !== undefined) ? `${r.working_hours} hrs` : '--'
    },
    {
      key: 'attendance_status',
      header: 'Shift Status',
      type: 'badge',
      sortable: true,
      width: '130px',
      badgeConfig: this.statusBadgeConfig
    },
    {
      key: 'remarks',
      header: 'Notes / Remarks',
      sortable: true,
      cell: (r) => r.remarks || 'Regular shift'
    }
  ];

  ngOnInit(): void {
    // Start real-time digital clock
    this.clockTimer = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);

    this.loadInitialData();
  }

  ngOnDestroy(): void {
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
    }
  }

  /**
   * Load master data: employees, departments, and attendance records
   */
  public loadInitialData(): void {
    this.isLoading.set(true);

    this.departmentService.getAll().subscribe(depts => {
      this.departments.set(depts);

      this.employeeService.getAll().subscribe(emps => {
        this.employees.set(emps);

        // Identify current employee based on logged in user
        const user = this.currentUser();
        const emp = this.findMatchingEmployee(user, emps);
        this.currentEmployee.set(emp || null);

        this.refreshAttendanceRecords();
      });
    });
  }

  /**
   * Refresh all attendance datasets
   */
  public refreshAttendanceRecords(): void {
    const emp = this.currentEmployee();
    const emps = this.employees();
    const depts = this.departments();

    this.attendanceService.getAll().subscribe(all => {
      // Map enriched display fields
      const enrichedAll = all.map(rec => this.enrichAttendance(rec, emps, depts));
      this.allRecords.set(enrichedAll);

      if (emp) {
        // Today's record for punch card
        this.attendanceService.getTodayRecord(emp.employee_id).subscribe(today => {
          this.todayRecord.set(today || null);
        });

        // My personal attendance history
        this.attendanceService.getByEmployee(emp.employee_id).subscribe(myList => {
          this.myRecords.set(myList.map(rec => this.enrichAttendance(rec, emps, depts)));
        });

        // Manager's team records
        if (this.canViewTeam()) {
          this.attendanceService.getByManager(emp.employee_id).subscribe(teamList => {
            this.teamRecords.set(teamList.map(rec => this.enrichAttendance(rec, emps, depts)));
            this.isLoading.set(false);
          });
        } else {
          this.isLoading.set(false);
        }
      } else {
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Check in action for active employee
   */
  public onCheckIn(): void {
    const emp = this.currentEmployee();
    if (!emp) {
      this.snackBar.open('No active employee profile linked to current user.', 'Close', { duration: 3000 });
      return;
    }

    this.isPunching.set(true);
    const remarks = this.punchRemarks() || 'Standard Office Punch-In';

    this.attendanceService.checkIn(emp.employee_id, remarks).subscribe({
      next: (rec) => {
        this.isPunching.set(false);
        this.punchRemarks.set('');
        this.snackBar.open(`Checked in successfully at ${rec.check_in}! Status: ${rec.attendance_status}`, 'Close', {
          duration: 3500
        });
        this.refreshAttendanceRecords();
      },
      error: (err) => {
        this.isPunching.set(false);
        this.snackBar.open(err?.message || 'Check-in failed.', 'Close', { duration: 4000 });
      }
    });
  }

  /**
   * Check out action for active employee
   */
  public onCheckOut(): void {
    const emp = this.currentEmployee();
    if (!emp) {
      this.snackBar.open('No active employee profile linked to current user.', 'Close', { duration: 3000 });
      return;
    }

    this.isPunching.set(true);
    const remarks = this.punchRemarks() || undefined;

    this.attendanceService.checkOut(emp.employee_id, remarks).subscribe({
      next: (rec) => {
        this.isPunching.set(false);
        this.punchRemarks.set('');
        this.snackBar.open(
          `Checked out at ${rec.check_out}! Working Hours: ${rec.working_hours} hrs (${rec.attendance_status}).`,
          'Close',
          { duration: 4000 }
        );
        this.refreshAttendanceRecords();
      },
      error: (err) => {
        this.isPunching.set(false);
        this.snackBar.open(err?.message || 'Check-out failed.', 'Close', { duration: 4000 });
      }
    });
  }

  /**
   * Open manual attendance entry dialog (HR / Admin)
   */
  public onOpenManualEntry(): void {
    const ref = this.dialog.open(AttendanceRecordDialogComponent, {
      width: '640px',
      data: { mode: 'create' },
      disableClose: true
    });

    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Attendance record successfully logged.', 'Close', { duration: 3000 });
        this.refreshAttendanceRecords();
      }
    });
  }

  /**
   * Handle table actions (edit / delete)
   */
  public onTableAction(event: { action: string; row: AttendanceDisplay }): void {
    if (event.action === 'edit') {
      const ref = this.dialog.open(AttendanceRecordDialogComponent, {
        width: '640px',
        data: { mode: 'edit', attendance: event.row },
        disableClose: true
      });

      ref.afterClosed().subscribe((result) => {
        if (result) {
          this.snackBar.open('Attendance record updated.', 'Close', { duration: 3000 });
          this.refreshAttendanceRecords();
        }
      });
    } else if (event.action === 'delete') {
      const empName = event.row.employee_name || `Employee #${event.row.employee_id}`;
      const ref = this.dialog.open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Attendance Record',
          message: `Are you sure you want to permanently delete the attendance record for ${empName} on ${event.row.attendance_date}?`,
          confirmText: 'Delete Record',
          confirmColor: 'warn'
        }
      });

      ref.afterClosed().subscribe((confirmed) => {
        if (confirmed) {
          this.attendanceService.delete(event.row.attendance_id).subscribe({
            next: () => {
              this.snackBar.open('Attendance record removed.', 'Close', { duration: 3000 });
              this.refreshAttendanceRecords();
            },
            error: (err) => {
              this.snackBar.open(err?.message || 'Failed to delete record.', 'Close', { duration: 4000 });
            }
          });
        }
      });
    }
  }

  /**
   * Quick filter setter: Today
   */
  public setFilterToday(): void {
    this.selectedDate.set(new Date().toISOString().split('T')[0]);
  }

  /**
   * Quick filter reset: Clear date filter
   */
  public clearDateFilter(): void {
    this.selectedDate.set('');
  }

  /**
   * Reset all filters
   */
  public resetFilters(): void {
    this.selectedDate.set('');
    this.selectedEmployeeId.set('all');
    this.selectedStatus.set('all');
  }

  /**
   * Map User account to Employee entity
   */
  private findMatchingEmployee(user: User | null, emps: Employee[]): Employee | undefined {
    if (!user) return undefined;

    // Match by email
    const byEmail = emps.find(e => e.email.toLowerCase() === user.email.toLowerCase());
    if (byEmail) return byEmail;

    // Match by name
    const [first, ...rest] = user.name.split(' ');
    const last = rest.join(' ');
    const byName = emps.find(e =>
      e.first_name.toLowerCase() === first.toLowerCase() &&
      e.last_name.toLowerCase() === last.toLowerCase()
    );
    if (byName) return byName;

    // Direct role mappings
    if (user.role === 'ADMIN') return emps.find(e => e.employee_id === 1);
    if (user.role === 'HR') return emps.find(e => e.employee_id === 2);
    if (user.role === 'MANAGER') return emps.find(e => e.employee_id === 4);
    return emps.find(e => e.employee_id === 5);
  }

  /**
   * Enrich attendance record with employee and department metadata
   */
  private enrichAttendance(record: Attendance, emps: Employee[], depts: Department[]): AttendanceDisplay {
    const emp = emps.find(e => String(e.employee_id) === String(record.employee_id));
    const dept = emp ? depts.find(d => String(d.department_id) === String(emp.department_id)) : undefined;

    return {
      ...record,
      employee_name: emp ? `${emp.first_name} ${emp.last_name}` : `EMP #${record.employee_id}`,
      employee_code: emp?.employee_code || `EMP-${record.employee_id}`,
      department_name: dept?.department_name || 'Operations',
      designation: emp?.designation || 'Staff'
    };
  }
}
