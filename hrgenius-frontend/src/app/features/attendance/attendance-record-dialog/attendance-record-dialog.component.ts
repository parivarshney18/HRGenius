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
import { Attendance } from '../../../core/models/attendance.model';
import { Employee } from '../../../core/models/employee.model';
import { AttendanceService, calculateWorkingHours } from '../../../core/services/attendance.service';
import { EmployeeService } from '../../../core/services/employee.service';

export interface AttendanceRecordDialogData {
  attendance?: Attendance;
  mode: 'create' | 'edit';
}

@Component({
  selector: 'app-attendance-record-dialog',
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
  templateUrl: './attendance-record-dialog.component.html',
  styleUrl: './attendance-record-dialog.component.scss'
})
export class AttendanceRecordDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AttendanceRecordDialogComponent>);
  public readonly data: AttendanceRecordDialogData = inject(MAT_DIALOG_DATA);
  private readonly attendanceService = inject(AttendanceService);
  private readonly employeeService = inject(EmployeeService);

  public readonly isEditMode = this.data.mode === 'edit';
  public readonly isSaving = signal(false);
  public readonly errorMessage = signal<string | null>(null);
  public readonly employees = signal<Employee[]>([]);

  public readonly calculatedHours = signal<number | null>(null);

  public readonly statusOptions = ['Present', 'Late', 'Half-day', 'Absent'];

  public form: FormGroup = this.fb.group({
    employee_id: [null, [Validators.required]],
    attendance_date: [new Date().toISOString().split('T')[0], [Validators.required]],
    check_in: ['09:00'],
    check_out: ['17:30'],
    attendance_status: ['Present', [Validators.required]],
    remarks: ['Regular corporate shift']
  });

  ngOnInit(): void {
    this.employeeService.getAll().subscribe(emps => {
      this.employees.set(emps);
    });

    if (this.isEditMode && this.data.attendance) {
      const a = this.data.attendance;
      this.form.patchValue({
        employee_id: Number(a.employee_id),
        attendance_date: a.attendance_date,
        check_in: a.check_in || '',
        check_out: a.check_out || '',
        attendance_status: a.attendance_status,
        remarks: a.remarks || ''
      });
      if (a.check_in && a.check_out) {
        this.calculatedHours.set(calculateWorkingHours(a.check_in, a.check_out));
      }
    } else {
      this.calculatedHours.set(8.5);
    }

    // Auto-recalculate working hours when check_in or check_out changes
    this.form.valueChanges.subscribe(val => {
      if (val.check_in && val.check_out) {
        const hrs = calculateWorkingHours(val.check_in, val.check_out);
        this.calculatedHours.set(hrs);
      } else {
        this.calculatedHours.set(null);
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
    const hours = (values.check_in && values.check_out)
      ? calculateWorkingHours(values.check_in, values.check_out)
      : (values.attendance_status === 'Absent' ? 0 : null);

    const recordPayload = {
      employee_id: Number(values.employee_id),
      attendance_date: values.attendance_date,
      check_in: values.check_in || null,
      check_out: values.check_out || null,
      attendance_status: values.attendance_status,
      working_hours: hours,
      remarks: values.remarks || null
    };

    if (this.isEditMode && this.data.attendance) {
      this.attendanceService.update(this.data.attendance.attendance_id, recordPayload).subscribe({
        next: (updated) => {
          this.isSaving.set(false);
          this.dialogRef.close(updated);
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMessage.set(err?.message || 'Failed to update attendance record.');
        }
      });
    } else {
      this.attendanceService.create(recordPayload).subscribe({
        next: (created) => {
          this.isSaving.set(false);
          this.dialogRef.close(created);
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMessage.set(err?.message || 'Failed to save attendance record.');
        }
      });
    }
  }

  public onCancel(): void {
    this.dialogRef.close(null);
  }
}
