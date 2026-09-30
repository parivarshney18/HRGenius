import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';
import { Payroll } from '../models/payroll.model';
import { Employee } from '../models/employee.model';
import { EmployeeService } from './employee.service';
import { environment } from '../../../environments/environment';

export function calculateGross(basic: number, allowances: number, bonus: number): number {
  return Math.round((Number(basic || 0) + Number(allowances || 0) + Number(bonus || 0)) * 100) / 100;
}

export function calculateNet(gross: number, deductions: number, tax: number): number {
  return Math.round((Number(gross || 0) - Number(deductions || 0) - Number(tax || 0)) * 100) / 100;
}

export interface GeneratePayrollParams {
  employee_id: string | number;
  payroll_month: string; // 'YYYY-MM'
  basic_salary?: number;
  allowances?: number;
  bonus?: number;
  deductions?: number;
  tax?: number;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PayrollService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/payroll`;
  private readonly employeeService = inject(EmployeeService);

  // Standard salary benchmarks mapped by designation keyword
  private readonly salaryDefaults: Record<string, { basic: number; allowances: number; taxRate: number; deductions: number }> = {
    'vp': { basic: 15000, allowances: 2500, taxRate: 0.22, deductions: 600 },
    'chief': { basic: 16000, allowances: 2800, taxRate: 0.24, deductions: 650 },
    'lead': { basic: 10500, allowances: 1800, taxRate: 0.18, deductions: 450 },
    'manager': { basic: 12000, allowances: 2000, taxRate: 0.20, deductions: 500 },
    'head': { basic: 11000, allowances: 1800, taxRate: 0.18, deductions: 450 },
    'senior': { basic: 9500, allowances: 1500, taxRate: 0.16, deductions: 400 },
    'engineer': { basic: 7500, allowances: 1200, taxRate: 0.15, deductions: 350 },
    'specialist': { basic: 6500, allowances: 1000, taxRate: 0.12, deductions: 300 },
    'analyst': { basic: 6800, allowances: 1100, taxRate: 0.14, deductions: 300 },
    'default': { basic: 6000, allowances: 1000, taxRate: 0.12, deductions: 300 }
  };

  // In-memory mock payroll records
  private payrolls: Payroll[] = [
    // August 2026 Payroll (All Paid)
    {
      payroll_id: 1,
      employee_id: 1, // Alex Mercer
      payroll_month: '2026-08',
      basic_salary: 15000,
      allowances: 2500,
      deductions: 600,
      tax: 3850,
      bonus: 1000,
      gross_salary: 18500,
      net_salary: 14050,
      payment_date: '2026-08-31',
      payroll_status: 'Paid'
    },
    {
      payroll_id: 2,
      employee_id: 2, // Sarah Jenkins
      payroll_month: '2026-08',
      basic_salary: 10500,
      allowances: 1800,
      deductions: 450,
      tax: 2214,
      bonus: 500,
      gross_salary: 12800,
      net_salary: 10136,
      payment_date: '2026-08-31',
      payroll_status: 'Paid'
    },
    {
      payroll_id: 3,
      employee_id: 4, // Marcus Vance
      payroll_month: '2026-08',
      basic_salary: 12000,
      allowances: 2000,
      deductions: 500,
      tax: 2800,
      bonus: 800,
      gross_salary: 14800,
      net_salary: 11500,
      payment_date: '2026-08-31',
      payroll_status: 'Paid'
    },
    {
      payroll_id: 4,
      employee_id: 5, // Elena Rostova
      payroll_month: '2026-08',
      basic_salary: 11000,
      allowances: 1800,
      deductions: 450,
      tax: 2304,
      bonus: 500,
      gross_salary: 13300,
      net_salary: 10546,
      payment_date: '2026-08-31',
      payroll_status: 'Paid'
    },
    {
      payroll_id: 5,
      employee_id: 6, // Liam Walker
      payroll_month: '2026-08',
      basic_salary: 9500,
      allowances: 1500,
      deductions: 400,
      tax: 1760,
      bonus: 400,
      gross_salary: 11400,
      net_salary: 9240,
      payment_date: '2026-08-31',
      payroll_status: 'Paid'
    },
    {
      payroll_id: 6,
      employee_id: 7, // Sophia Chen
      payroll_month: '2026-08',
      basic_salary: 7500,
      allowances: 1200,
      deductions: 350,
      tax: 1305,
      bonus: 300,
      gross_salary: 9000,
      net_salary: 7345,
      payment_date: '2026-08-31',
      payroll_status: 'Paid'
    },

    // September 2026 Payroll (Processed & Drafts)
    {
      payroll_id: 7,
      employee_id: 1, // Alex Mercer
      payroll_month: '2026-09',
      basic_salary: 15000,
      allowances: 2500,
      deductions: 600,
      tax: 3850,
      bonus: 1200,
      gross_salary: 18700,
      net_salary: 14250,
      payment_date: '2026-09-30',
      payroll_status: 'Processed'
    },
    {
      payroll_id: 8,
      employee_id: 2, // Sarah Jenkins
      payroll_month: '2026-09',
      basic_salary: 10500,
      allowances: 1800,
      deductions: 450,
      tax: 2214,
      bonus: 600,
      gross_salary: 12900,
      net_salary: 10236,
      payment_date: '2026-09-30',
      payroll_status: 'Processed'
    },
    {
      payroll_id: 9,
      employee_id: 4, // Marcus Vance
      payroll_month: '2026-09',
      basic_salary: 12000,
      allowances: 2000,
      deductions: 500,
      tax: 2800,
      bonus: 500,
      gross_salary: 14500,
      net_salary: 11200,
      payment_date: '2026-09-30',
      payroll_status: 'Processed'
    },
    {
      payroll_id: 10,
      employee_id: 5, // Elena Rostova
      payroll_month: '2026-09',
      basic_salary: 11000,
      allowances: 1800,
      deductions: 450,
      tax: 2304,
      bonus: 400,
      gross_salary: 13200,
      net_salary: 10446,
      payment_date: '2026-09-30',
      payroll_status: 'Processed'
    },
    {
      payroll_id: 11,
      employee_id: 6, // Liam Walker
      payroll_month: '2026-09',
      basic_salary: 9500,
      allowances: 1500,
      deductions: 400,
      tax: 1760,
      bonus: 0,
      gross_salary: 11000,
      net_salary: 8840,
      payment_date: null,
      payroll_status: 'Draft'
    },
    {
      payroll_id: 12,
      employee_id: 7, // Sophia Chen
      payroll_month: '2026-09',
      basic_salary: 7500,
      allowances: 1200,
      deductions: 350,
      tax: 1305,
      bonus: 0,
      gross_salary: 8700,
      net_salary: 7045,
      payment_date: null,
      payroll_status: 'Draft'
    }
  ];

  /**
   * Retrieve all payroll records
   */
  public getAll(): Observable<Payroll[]> {
    if (!environment.useMock) {
      return this.http.get<Payroll[]>(this.apiUrl);
    }
    return of([...this.payrolls]).pipe(delay(250));
  }

  /**
   * Retrieve payrolls by employee ID
   */
  public getByEmployee(employeeId: string | number): Observable<Payroll[]> {
    if (!environment.useMock) {
      return this.http.get<Payroll[]>(`${this.apiUrl}/employee/${employeeId}`);
    }
    const list = this.payrolls.filter(p => String(p.employee_id) === String(employeeId));
    return of([...list]).pipe(delay(200));
  }

  /**
   * Retrieve payrolls for a specific month (YYYY-MM)
   */
  public getByMonth(month: string): Observable<Payroll[]> {
    if (!environment.useMock) {
      return this.http.get<Payroll[]>(`${this.apiUrl}/month/${month}`);
    }
    const list = this.payrolls.filter(p => p.payroll_month === month);
    return of([...list]).pipe(delay(200));
  }

  /**
   * Retrieve single payroll by ID
   */
  public getById(id: string | number): Observable<Payroll | undefined> {
    if (!environment.useMock) {
      return this.http.get<Payroll>(`${this.apiUrl}/${id}`);
    }
    const record = this.payrolls.find(p => String(p.payroll_id) === String(id));
    return of(record ? { ...record } : undefined).pipe(delay(150));
  }

  /**
   * Generate or calculate payroll for a single employee
   */
  public generateForEmployee(params: GeneratePayrollParams): Observable<Payroll> {
    if (!environment.useMock) {
      return this.http.post<Payroll>(`${this.apiUrl}/generate`, params);
    }

    return this.employeeService.getById(params.employee_id).pipe(
      delay(200),
      switchMap(emp => {
        const designation = (emp?.designation || '').toLowerCase();
        let defaults = this.salaryDefaults['default'];

        for (const [key, val] of Object.entries(this.salaryDefaults)) {
          if (designation.includes(key)) {
            defaults = val;
            break;
          }
        }

        const basic = params.basic_salary !== undefined ? params.basic_salary : defaults.basic;
        const allowances = params.allowances !== undefined ? params.allowances : defaults.allowances;
        const bonus = params.bonus !== undefined ? params.bonus : 0;
        const deductions = params.deductions !== undefined ? params.deductions : defaults.deductions;

        const gross = calculateGross(basic, allowances, bonus);
        const tax = params.tax !== undefined ? params.tax : Math.round(gross * defaults.taxRate);
        const net = calculateNet(gross, deductions, tax);

        const existingIndex = this.payrolls.findIndex(
          p => String(p.employee_id) === String(params.employee_id) && p.payroll_month === params.payroll_month
        );

        if (existingIndex !== -1) {
          const updated: Payroll = {
            ...this.payrolls[existingIndex],
            basic_salary: basic,
            allowances,
            bonus,
            deductions,
            tax,
            gross_salary: gross,
            net_salary: net,
            payroll_status: params.status || this.payrolls[existingIndex].payroll_status
          };
          this.payrolls[existingIndex] = updated;
          this.payrolls = [...this.payrolls];
          return of({ ...updated });
        }

        const nextId = this.payrolls.length > 0
          ? Math.max(...this.payrolls.map(p => Number(p.payroll_id) || 0)) + 1
          : 1;

        const newPayroll: Payroll = {
          payroll_id: nextId,
          employee_id: params.employee_id,
          payroll_month: params.payroll_month,
          basic_salary: basic,
          allowances,
          bonus,
          deductions,
          tax,
          gross_salary: gross,
          net_salary: net,
          payment_date: params.status === 'Paid' ? new Date().toISOString().split('T')[0] : null,
          payroll_status: params.status || 'Draft'
        };

        this.payrolls = [newPayroll, ...this.payrolls];
        return of({ ...newPayroll });
      })
    );
  }

  /**
   * Bulk generate payroll for all active employees for a given month
   */
  public generateForAll(month: string): Observable<Payroll[]> {
    if (!environment.useMock) {
      return this.http.post<Payroll[]>(`${this.apiUrl}/generate-bulk`, { payroll_month: month });
    }

    return this.employeeService.getAll().pipe(
      delay(300),
      switchMap(employees => {
        const activeEmployees = employees.filter(e => e.status.toLowerCase() === 'active');
        const generated: Payroll[] = [];

        for (const emp of activeEmployees) {
          const designation = (emp.designation || '').toLowerCase();
          let defaults = this.salaryDefaults['default'];

          for (const [key, val] of Object.entries(this.salaryDefaults)) {
            if (designation.includes(key)) {
              defaults = val;
              break;
            }
          }

          const basic = defaults.basic;
          const allowances = defaults.allowances;
          const bonus = 0;
          const deductions = defaults.deductions;
          const gross = calculateGross(basic, allowances, bonus);
          const tax = Math.round(gross * defaults.taxRate);
          const net = calculateNet(gross, deductions, tax);

          const existingIndex = this.payrolls.findIndex(
            p => String(p.employee_id) === String(emp.employee_id) && p.payroll_month === month
          );

          if (existingIndex !== -1) {
            generated.push(this.payrolls[existingIndex]);
          } else {
            const nextId = this.payrolls.length > 0
              ? Math.max(...this.payrolls.map(p => Number(p.payroll_id) || 0)) + 1
              : 1;

            const newRec: Payroll = {
              payroll_id: nextId,
              employee_id: emp.employee_id,
              payroll_month: month,
              basic_salary: basic,
              allowances,
              bonus,
              deductions,
              tax,
              gross_salary: gross,
              net_salary: net,
              payment_date: null,
              payroll_status: 'Draft'
            };
            this.payrolls.push(newRec);
            generated.push(newRec);
          }
        }

        this.payrolls = [...this.payrolls];
        return of([...this.payrolls.filter(p => p.payroll_month === month)]);
      })
    );
  }

  /**
   * Update status (Draft -> Processed -> Paid)
   */
  public updateStatus(id: string | number, status: string, paymentDate?: string | null): Observable<Payroll> {
    if (!environment.useMock) {
      return this.http.put<Payroll>(`${this.apiUrl}/${id}/status`, { payroll_status: status, payment_date: paymentDate });
    }

    const index = this.payrolls.findIndex(p => String(p.payroll_id) === String(id));
    if (index === -1) {
      throw new Error(`Payroll record #${id} not found.`);
    }

    const payDate = paymentDate !== undefined
      ? paymentDate
      : (status === 'Paid' ? new Date().toISOString().split('T')[0] : this.payrolls[index].payment_date);

    const updated: Payroll = {
      ...this.payrolls[index],
      payroll_status: status,
      payment_date: payDate
    };

    this.payrolls[index] = updated;
    this.payrolls = [...this.payrolls];
    return of({ ...updated }).pipe(delay(200));
  }

  /**
   * Delete payroll
   */
  public delete(id: string | number): Observable<boolean> {
    if (!environment.useMock) {
      return this.http.delete<boolean>(`${this.apiUrl}/${id}`);
    }

    const index = this.payrolls.findIndex(p => String(p.payroll_id) === String(id));
    if (index !== -1) {
      this.payrolls.splice(index, 1);
      this.payrolls = [...this.payrolls];
      return of(true).pipe(delay(200));
    }
    return of(false).pipe(delay(150));
  }
}
