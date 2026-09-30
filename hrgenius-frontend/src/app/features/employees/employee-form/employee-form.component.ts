import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { Employee } from '../../../core/models/employee.model';
import { Department } from '../../../core/models/department.model';
import { EmployeeService } from '../../../core/services/employee.service';
import { DepartmentService } from '../../../core/services/department.service';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.scss'
})
export class EmployeeFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly employeeService = inject(EmployeeService);
  private readonly departmentService = inject(DepartmentService);
  private readonly snackBar = inject(MatSnackBar);

  public readonly isEditMode = signal(false);
  public readonly employeeId = signal<string | number | null>(null);
  public readonly isLoading = signal(true);
  public readonly isSaving = signal(false);
  public readonly errorMessage = signal<string | null>(null);

  public readonly departments = signal<Department[]>([]);
  public readonly allEmployees = signal<Employee[]>([]);

  // Filter out self from manager dropdown if in edit mode
  public readonly eligibleManagers = computed(() => {
    const currentId = this.employeeId();
    if (!currentId) return this.allEmployees();
    return this.allEmployees().filter(e => String(e.employee_id) !== String(currentId));
  });

  public readonly genderOptions = ['Male', 'Female', 'Non-Binary', 'Other'];
  public readonly employmentTypeOptions = ['Full-Time', 'Part-Time', 'Contract', 'Intern'];
  public readonly statusOptions = ['Active', 'Inactive'];

  public form: FormGroup = this.fb.group({
    employee_code: ['', [Validators.required]],
    first_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    last_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.minLength(7)]],
    gender: ['Male', [Validators.required]],
    date_of_birth: ['', [Validators.required]],
    address: ['', [Validators.required]],
    date_of_joining: ['', [Validators.required]],
    department_id: [null, [Validators.required]],
    manager_id: [null],
    designation: ['', [Validators.required, Validators.minLength(2)]],
    employment_type: ['Full-Time', [Validators.required]],
    status: ['Active', [Validators.required]]
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.employeeId.set(id);
    }

    this.loadDropdownsAndData();
  }

  private loadDropdownsAndData(): void {
    this.isLoading.set(true);

    this.departmentService.getAll().subscribe({
      next: (depts) => {
        this.departments.set(depts);
        this.employeeService.getAll().subscribe({
          next: (emps) => {
            this.allEmployees.set(emps);

            if (this.isEditMode() && this.employeeId()) {
              this.loadEmployeeData(this.employeeId()!);
            } else {
              // Pre-fill next code
              const nextId = emps.length > 0 ? Math.max(...emps.map(e => Number(e.employee_id) || 0)) + 1 : 1;
              this.form.patchValue({
                employee_code: `EMP-${String(nextId).padStart(3, '0')}`,
                date_of_joining: new Date().toISOString().split('T')[0]
              });
              this.isLoading.set(false);
            }
          },
          error: () => {
            this.isLoading.set(false);
            this.snackBar.open('Failed to load employee list', 'Dismiss', { duration: 3000 });
          }
        });
      },
      error: () => {
        this.isLoading.set(false);
        this.snackBar.open('Failed to load departments', 'Dismiss', { duration: 3000 });
      }
    });
  }

  private loadEmployeeData(id: string | number): void {
    this.employeeService.getById(id).subscribe({
      next: (emp) => {
        if (emp) {
          this.form.patchValue({
            employee_code: emp.employee_code,
            first_name: emp.first_name,
            last_name: emp.last_name,
            email: emp.email,
            phone: emp.phone,
            gender: emp.gender,
            date_of_birth: emp.date_of_birth,
            address: emp.address,
            date_of_joining: emp.date_of_joining,
            department_id: Number(emp.department_id),
            manager_id: emp.manager_id ? Number(emp.manager_id) : null,
            designation: emp.designation,
            employment_type: emp.employment_type,
            status: emp.status
          });
        } else {
          this.errorMessage.set('Employee record not found.');
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Error retrieving employee record.');
      }
    });
  }

  public onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const values = this.form.value;

    if (this.isEditMode() && this.employeeId()) {
      this.employeeService.update(this.employeeId()!, values).subscribe({
        next: (updated) => {
          this.isSaving.set(false);
          this.snackBar.open(`Employee "${updated.first_name} ${updated.last_name}" updated successfully.`, 'Dismiss', {
            duration: 3500
          });
          this.router.navigate(['/employees', updated.employee_id]);
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMessage.set(err?.message || 'Failed to update employee.');
        }
      });
    } else {
      this.employeeService.create(values).subscribe({
        next: (created) => {
          this.isSaving.set(false);
          this.snackBar.open(`Employee "${created.first_name} ${created.last_name}" added successfully.`, 'Dismiss', {
            duration: 3500
          });
          this.router.navigate(['/employees']);
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMessage.set(err?.message || 'Failed to create employee.');
        }
      });
    }
  }

  public onCancel(): void {
    if (this.isEditMode() && this.employeeId()) {
      this.router.navigate(['/employees', this.employeeId()]);
    } else {
      this.router.navigate(['/employees']);
    }
  }
}
