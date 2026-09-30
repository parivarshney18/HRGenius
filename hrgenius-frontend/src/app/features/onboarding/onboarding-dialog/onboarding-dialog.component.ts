import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { Onboarding } from '../../../core/models/onboarding.model';
import { Candidate } from '../../../core/models/candidate.model';
import { Job } from '../../../core/models/job.model';
import { Department } from '../../../core/models/department.model';
import { Employee } from '../../../core/models/employee.model';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { DepartmentService } from '../../../core/services/department.service';
import { EmployeeService } from '../../../core/services/employee.service';

export interface OnboardingDialogData {
  onboarding: Onboarding;
  candidate: Candidate;
  job?: Job;
}

@Component({
  selector: 'app-onboarding-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './onboarding-dialog.component.html',
  styleUrl: './onboarding-dialog.component.scss'
})
export class OnboardingDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<OnboardingDialogComponent>);
  public readonly data: OnboardingDialogData = inject(MAT_DIALOG_DATA);
  private readonly onboardingService = inject(OnboardingService);
  private readonly departmentService = inject(DepartmentService);
  private readonly employeeService = inject(EmployeeService);

  public readonly isSaving = signal(false);
  public readonly isCompleting = signal(false);
  public readonly errorMessage = signal<string | null>(null);

  public readonly departments = signal<Department[]>([]);
  public readonly managers = signal<Employee[]>([]);

  public readonly documentStatuses = ['Pending', 'Submitted', 'Verified'];
  public readonly verificationStatuses = ['Pending', 'In Progress', 'Passed'];

  public form: FormGroup = this.fb.group({
    joining_date: ['', [Validators.required]],
    document_status: ['Submitted', [Validators.required]],
    verification_status: ['In Progress', [Validators.required]],
    assigned_department: [null, [Validators.required]],
    assigned_manager: [null, [Validators.required]],
    designation: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['+1 (555) 789-4321', [Validators.required]],
    address: ['742 Evergreen Terrace, New York, NY', [Validators.required]]
  });

  ngOnInit(): void {
    // Load departments
    this.departmentService.getAll().subscribe(depts => this.departments.set(depts));

    // Load managers
    this.employeeService.getAll().subscribe(emps => this.managers.set(emps));

    const o = this.data.onboarding;
    const defaultDesignation = this.data.job?.job_title || 'Software Specialist';

    this.form.patchValue({
      joining_date: o.joining_date || new Date().toISOString().split('T')[0],
      document_status: o.document_status || 'Submitted',
      verification_status: o.verification_status || 'In Progress',
      assigned_department: o.assigned_department ? Number(o.assigned_department) : (this.data.job ? Number(this.data.job.department_id) : null),
      assigned_manager: o.assigned_manager ? Number(o.assigned_manager) : null,
      designation: defaultDesignation
    });
  }

  public onSaveDraft(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const values = this.form.value;

    this.onboardingService.update(this.data.onboarding.onboarding_id, {
      joining_date: values.joining_date,
      document_status: values.document_status,
      verification_status: values.verification_status,
      assigned_department: values.assigned_department,
      assigned_manager: values.assigned_manager
    }).subscribe({
      next: (updated) => {
        this.isSaving.set(false);
        this.dialogRef.close({ action: 'saved', onboarding: updated });
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(err?.message || 'Failed to update onboarding draft.');
      }
    });
  }

  public onCompleteOnboarding(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isCompleting.set(true);
    this.errorMessage.set(null);

    const values = this.form.value;

    this.onboardingService.completeOnboarding({
      onboarding_id: this.data.onboarding.onboarding_id,
      candidate_id: this.data.candidate.candidate_id,
      joining_date: values.joining_date,
      document_status: values.document_status,
      verification_status: values.verification_status,
      assigned_department: values.assigned_department,
      assigned_manager: values.assigned_manager,
      designation: values.designation,
      phone: values.phone,
      address: values.address
    }).subscribe({
      next: (result) => {
        this.isCompleting.set(false);
        this.dialogRef.close({ action: 'completed', result });
      },
      error: (err) => {
        this.isCompleting.set(false);
        this.errorMessage.set(err?.message || 'Failed to complete onboarding.');
      }
    });
  }

  public onCancel(): void {
    this.dialogRef.close(null);
  }
}
