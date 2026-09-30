import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Payroll } from '../../../core/models/payroll.model';
import { Employee } from '../../../core/models/employee.model';
import { Department } from '../../../core/models/department.model';

export interface PayslipDetailDialogData {
  payroll: Payroll;
  employee?: Employee;
  department?: Department;
}

@Component({
  selector: 'app-payslip-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './payslip-detail-dialog.component.html',
  styleUrl: './payslip-detail-dialog.component.scss'
})
export class PayslipDetailDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<PayslipDetailDialogComponent>);
  public readonly data: PayslipDetailDialogData = inject(MAT_DIALOG_DATA);

  public onPrint(): void {
    window.print();
  }

  public onClose(): void {
    this.dialogRef.close();
  }
}
