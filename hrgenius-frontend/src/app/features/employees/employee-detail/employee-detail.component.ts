import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { Employee } from '../../../core/models/employee.model';
import { Department } from '../../../core/models/department.model';
import { EmployeeService } from '../../../core/services/employee.service';
import { DepartmentService } from '../../../core/services/department.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './employee-detail.component.html',
  styleUrl: './employee-detail.component.scss'
})
export class EmployeeDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly employeeService = inject(EmployeeService);
  private readonly departmentService = inject(DepartmentService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  public readonly employee = signal<Employee | null>(null);
  public readonly department = signal<Department | null>(null);
  public readonly manager = signal<Employee | null>(null);
  public readonly isLoading = signal(true);
  public readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEmployeeDetails(id);
    } else {
      this.errorMessage.set('Invalid employee ID.');
      this.isLoading.set(false);
    }
  }

  public loadEmployeeDetails(id: string | number): void {
    this.isLoading.set(true);
    this.employeeService.getById(id).subscribe({
      next: (emp) => {
        if (!emp) {
          this.errorMessage.set('Employee record not found.');
          this.isLoading.set(false);
          return;
        }

        this.employee.set(emp);

        // Load linked Department
        this.departmentService.getById(emp.department_id).subscribe({
          next: (dept) => {
            if (dept) this.department.set(dept);
          }
        });

        // Load linked Manager if exists
        if (emp.manager_id) {
          this.employeeService.getById(emp.manager_id).subscribe({
            next: (mgr) => {
              if (mgr) this.manager.set(mgr);
            }
          });
        }

        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Error retrieving employee record.');
      }
    });
  }

  public navigateToEdit(): void {
    const emp = this.employee();
    if (emp) {
      this.router.navigate(['/employees', emp.employee_id, 'edit']);
    }
  }

  public confirmDelete(): void {
    const emp = this.employee();
    if (!emp) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Employee Record',
        message: `Are you sure you want to permanently delete "${emp.first_name} ${emp.last_name}" (${emp.employee_code})?`,
        confirmText: 'Delete Employee',
        cancelText: 'Cancel',
        confirmColor: 'warn',
        icon: 'person_remove'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.employeeService.delete(emp.employee_id).subscribe({
          next: () => {
            this.snackBar.open(`Employee "${emp.first_name} ${emp.last_name}" was deleted.`, 'Dismiss', {
              duration: 3500
            });
            this.router.navigate(['/employees']);
          },
          error: (err) => {
            this.snackBar.open(err?.message || 'Failed to delete employee', 'Dismiss', {
              duration: 3500
            });
          }
        });
      }
    });
  }
}
