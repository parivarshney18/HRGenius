export interface Employee {
  employee_id: string | number;
  employee_code: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  date_of_joining: string;
  department_id: string | number;
  manager_id: string | number | null;
  designation: string;
  employment_type: string;
  status: string;
}
