export interface Payroll {
  payroll_id: string | number;
  employee_id: string | number;
  payroll_month: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  tax: number;
  bonus: number;
  gross_salary: number;
  net_salary: number;
  payment_date?: string | null;
  payroll_status: string;
}
