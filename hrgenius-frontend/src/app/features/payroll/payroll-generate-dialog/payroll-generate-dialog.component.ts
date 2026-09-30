import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PayrollService, calculateGross, calculateNet } from '../../../core/services/payroll.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { Employee } from '../../../core/models/employee.model';

@Component({
  selector: 'app-payroll-generate-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './payroll-generate-dialog.component.html',
  styleUrl: './payroll-generate-dialog.component.scss'
})
export class PayrollGenerateDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<PayrollGenerateDialogComponent>);
  private readonly payrollService = inject(PayrollService);
  private readonly employeeService = inject(EmployeeService);

  public readonly isSubmitting = signal(false);
  public readonly errorMessage = signal<string | null>(null);
  public readonly employees = signal<Employee[]>([]);

  public readonly liveGross = signal<number>(0);
  public readonly liveNet = signal<number>(0);

  public form: FormGroup = this.fb.group({
    mode: ['all', [Validators.required]], // 'all' or 'single'
    payroll_month: ['2026-09', [Validators.required]],
    employee_id: [null],
    basic_salary: [7500],
    allowances: [1200],
    bonus: [0],
    deductions: [350],
    tax: [1305],
    status: ['Draft']
  });

  ngOnInit(): void {
    this.employeeService.getAll().subscribe(emps => {
      this.employees.set(emps);
    });

    this.recomputeCalculations();
    this.form.valueChanges.subscribe(() => {
      this.recomputeCalculations();
    });
  }

  private recomputeCalculations(): void {
    const val = this.form.value;
    const gross = calculateGross(val.basic_salary, val.allowances, val.bonus);
    const net = calculateNet(gross, val.deductions, val.tax);
    this.liveGross.set(gross);
    this.liveNet.set(net);
  }

  public onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const val = this.form.value;

    if (val.mode === 'all') {
      this.payrollService.generateForAll(val.payroll_month).subscribe({
        next: (results) => {
          this.isSubmitting.set(false);
          this.dialogRef.close(results);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err?.message || 'Failed to bulk-generate payroll.');
        }
      });
    } else {
      if (!val.employee_id) {
        this.isSubmitting.set(false);
        this.errorMessage.set('Please select an employee.');
        return;
      }

      this.payrollService.generateForEmployee({
        employee_id: val.employee_id,
        payroll_month: val.payroll_month,
        basic_salary: val.basic_salary,
        allowances: val.allowances,
        bonus: val.bonus,
        deductions: val.deductions,
        tax: val.tax,
        status: val.status
      }).subscribe({
        next: (result) => {
          this.isSubmitting.set(false);
          this.dialogRef.close([result]);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err?.message || 'Failed to generate employee payroll.');
        }
      });
    }
  }

  public onCancel(): void {
    this.dialogRef.close(null);
  }
}
