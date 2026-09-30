import { Payroll } from './payroll.model';

export interface UserProfile {
  user_id?: number;
  username: string;
  role: string;
  employee_id?: number;
  employee_code?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  date_of_birth?: string;
  gender?: string;
  email?: string;
  phone?: string;
  address?: string;
  date_of_joining?: string;
  department_id?: number;
  department_name?: string;
  manager_id?: number | null;
  manager_name?: string | null;
  designation?: string;
  employment_type?: string;
  status?: string;
  salary_history?: Payroll[];
}
