export type UserRole = 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  email: string;
  department?: string;
  title?: string;
}

export interface NavItem {
  title: string;
  icon: string;
  route: string;
  roles: UserRole[];
  description?: string;
}
