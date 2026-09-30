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
import { Employee } from '../../../core/models/employee.model';
import { Department } from '../../../core/models/department.model';
import { EmployeeService } from '../../../core/services/employee.service';
import { DepartmentService } from '../../../core/services/department.service';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { TableColumn, TableAction } from '../../../shared/components/data-table/data-table.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-employee-list',
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
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.scss'
})
export class EmployeeListComponent implements OnInit {
  private readonly employeeService = inject(EmployeeService);
  private readonly departmentService = inject(DepartmentService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  public readonly employees = signal<Employee[]>([]);
  public readonly departments = signal<Department[]>([]);
  public readonly isLoading = signal<boolean>(true);
  public selectedDepartmentId = signal<string>('ALL');

  public readonly departmentMap = computed(() => {
    const map = new Map<string | number, string>();
    this.departments().forEach(d => map.set(String(d.department_id), d.department_name));
    return map;
  });

  public readonly filteredEmployees = computed(() => {
    const all = this.employees();
    const deptFilter = this.selectedDepartmentId();
    if (deptFilter === 'ALL') {
      return all;
    }
    return all.filter(e => String(e.department_id) === deptFilter);
  });

  public readonly activeCount = computed(() =>
    this.employees().filter(e => e.status.toLowerCase() === 'active').length
  );

  public readonly fullTimeCount = computed(() =>
    this.employees().filter(e => e.employment_type.toLowerCase() === 'full-time').length
  );

  public readonly columns: TableColumn<Employee>[] = [
    {
      key: 'employee_code',
      header: 'Code',
      sortable: true,
      width: '100px'
    },
    {
      key: 'first_name',
      header: 'Employee Name',
      sortable: true,
      cell: (row) => `${row.first_name} ${row.last_name}`
    },
    {
      key: 'designation',
      header: 'Designation',
      sortable: true
    },
    {
      key: 'department_id',
      header: 'Department',
      sortable: true,
      cell: (row) => this.departmentMap().get(String(row.department_id)) || `Dept #${row.department_id}`
    },
    {
      key: 'employment_type',
      header: 'Type',
      sortable: true,
      width: '130px'
    },
    {
      key: 'status',
      header: 'Status',
      type: 'badge',
      sortable: true,
      width: '110px',
      badgeConfig: {
        'Active': { bg: '#dcfce7', color: '#15803d', border: '#86efac' },
        'Inactive': { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' }
      }
    }
  ];

  public readonly actions: TableAction<Employee>[] = [
    {
      name: 'view',
      icon: 'visibility',
      color: 'primary',
      tooltip: 'View Profile'
    },
    {
      name: 'edit',
      icon: 'edit',
      color: 'primary',
      tooltip: 'Edit Employee'
    },
    {
      name: 'delete',
      icon: 'delete',
      color: 'warn',
      tooltip: 'Delete Employee'
    }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  public loadData(): void {
    this.isLoading.set(true);
    // Load departments and employees concurrently
    this.departmentService.getAll().subscribe({
      next: (depts) => {
        this.departments.set(depts);
        this.employeeService.getAll().subscribe({
          next: (emps) => {
            this.employees.set(emps);
            this.isLoading.set(false);
          },
          error: () => {
            this.isLoading.set(false);
            this.snackBar.open('Failed to load employees', 'Dismiss', { duration: 3000 });
          }
        });
      },
      error: () => {
        this.isLoading.set(false);
        this.snackBar.open('Failed to load departments', 'Dismiss', { duration: 3000 });
      }
    });
  }

  public onDepartmentFilterChange(deptId: string): void {
    this.selectedDepartmentId.set(deptId);
  }

  public handleActionClick(event: { action: string; row: Employee }): void {
    switch (event.action) {
      case 'view':
        this.router.navigate(['/employees', event.row.employee_id]);
        break;
      case 'edit':
        this.router.navigate(['/employees', event.row.employee_id, 'edit']);
        break;
      case 'delete':
        this.confirmDelete(event.row);
        break;
    }
  }

  public navigateToAdd(): void {
    this.router.navigate(['/employees/new']);
  }

  private confirmDelete(employee: Employee): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Employee Record',
        message: `Are you sure you want to delete "${employee.first_name} ${employee.last_name}" (${employee.employee_code})? This will remove all associated historical associations.`,
        confirmText: 'Delete Employee',
        cancelText: 'Cancel',
        confirmColor: 'warn',
        icon: 'person_remove'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.isLoading.set(true);
        this.employeeService.delete(employee.employee_id).subscribe({
          next: () => {
            this.snackBar.open(`Employee "${employee.first_name} ${employee.last_name}" deleted.`, 'Dismiss', {
              duration: 3500
            });
            this.loadData();
          },
          error: (err) => {
            this.isLoading.set(false);
            this.snackBar.open(err?.message || 'Failed to delete employee', 'Dismiss', {
              duration: 3500
            });
          }
        });
      }
    });
  }
}
