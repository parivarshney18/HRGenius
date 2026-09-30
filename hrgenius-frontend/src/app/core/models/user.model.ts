export type UserRole = 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE';

export interface User {
  id?: string | number;
  user_id?: number;
  username: string;
  name: string;
  role: UserRole;
  email: string;
  department?: string;
  title?: string;
  employee_id?: number | null;
  employee_name?: string | null;
  token?: string;
}


export interface NavItem {
  title: string;
  icon: string;
  route: string;
  roles: UserRole[];
  description?: string;
}
