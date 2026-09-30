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
import { Department } from '../../../core/models/department.model';
import { DepartmentService } from '../../../core/services/department.service';

export interface DepartmentDialogData {
  department?: Department;
  mode: 'create' | 'edit';
}

@Component({
  selector: 'app-department-dialog',
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
    MatProgressSpinnerModule
  ],
  templateUrl: './department-dialog.component.html',
  styleUrl: './department-dialog.component.scss'
})
export class DepartmentDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<DepartmentDialogComponent>);
  public readonly data: DepartmentDialogData = inject(MAT_DIALOG_DATA);
  private readonly departmentService = inject(DepartmentService);

  public readonly isEditMode = this.data.mode === 'edit';
  public readonly isSaving = signal(false);
  public readonly errorMessage = signal<string | null>(null);

  public form: FormGroup = this.fb.group({
    department_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    description: ['', [Validators.required, Validators.maxLength(250)]],
    department_head: ['', [Validators.required, Validators.minLength(2)]],
    status: ['Active', [Validators.required]]
  });

  public readonly statusOptions = ['Active', 'Inactive'];

  ngOnInit(): void {
    if (this.isEditMode && this.data.department) {
      this.form.patchValue({
        department_name: this.data.department.department_name,
        description: this.data.department.description,
        department_head: this.data.department.department_head,
        status: this.data.department.status
      });
    }
  }

  public onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const formValues = this.form.value;

    if (this.isEditMode && this.data.department) {
      this.departmentService.update(this.data.department.department_id, formValues).subscribe({
        next: (updatedDept) => {
          this.isSaving.set(false);
          this.dialogRef.close(updatedDept);
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMessage.set(err?.message || 'Failed to update department. Please try again.');
        }
      });
    } else {
      this.departmentService.create(formValues).subscribe({
        next: (createdDept) => {
          this.isSaving.set(false);
          this.dialogRef.close(createdDept);
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMessage.set(err?.message || 'Failed to create department. Please try again.');
        }
      });
    }
  }

  public onCancel(): void {
    this.dialogRef.close(null);
  }
}
