import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { User, UserRole, NavItem } from '../models/user.model';
import { environment } from '../../../environments/environment';

interface MockAccount {
  user: User;
  passwordHash: string; // "123456"
}

interface LoginApiResponse {
  token?: string;
  access_token?: string;
  token_type?: string;
  user_id?: number;
  username: string;
  email?: string;
  role: string;
  employee_id?: number;
  employee_name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly STORAGE_KEY = 'hrgenius_auth_user';

  // Mock users per requirements
  private readonly mockAccounts: MockAccount[] = [
    {
      user: {
        id: 'u-admin-1',
        user_id: 1,
        employee_id: 1,
        username: 'admin',
        name: 'Arun Kumar',
        employee_name: 'Arun Kumar',
        role: 'ADMIN',
        email: 'admin@hrgenius.com',
        department: 'Information Technology',
        title: 'VP of Technology'
      },
      passwordHash: '123456'
    },
    {
      user: {
        id: 'u-hr-2',
        user_id: 2,
        employee_id: 2,
        username: 'hr',
        name: 'Priya Sharma',
        employee_name: 'Priya Sharma',
        role: 'HR',
        email: 'hr@hrgenius.com',
        department: 'Human Resources',
        title: 'HR Operations Lead'
      },
      passwordHash: '123456'
    },
    {
      user: {
        id: 'u-mgr-3',
        user_id: 3,
        employee_id: 3,
        username: 'manager',
        name: 'Vikram Malhotra',
        employee_name: 'Vikram Malhotra',
        role: 'MANAGER',
        email: 'manager@hrgenius.com',
        department: 'Engineering & Technology',
        title: 'Engineering Manager'
      },
      passwordHash: '123456'
    },
    {
      user: {
        id: 'u-emp-4',
        user_id: 4,
        employee_id: 4,
        username: 'employee',
        name: 'Ananya Iyer',
        employee_name: 'Ananya Iyer',
        role: 'EMPLOYEE',
        email: 'employee@hrgenius.com',
        department: 'Engineering & Technology',
        title: 'Senior Software Engineer'
      },
      passwordHash: '123456'
    }
  ];

  // Navigation catalog with role-based visibility
  public readonly allNavItems: NavItem[] = [
    {
      title: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard',
      roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
      description: 'Overview of HR metrics, announcements, and quick actions'
    },
    {
      title: 'Attendance',
      icon: 'schedule',
      route: '/attendance',
      roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
      description: 'Daily punch in/out, team attendance, and organization timesheets'
    },
    // Admin Modules
    {
      title: 'User Management',
      icon: 'manage_accounts',
      route: '/admin/users',
      roles: ['ADMIN'],
      description: 'Manage employee system accounts, permissions, and roles'
    },
    {
      title: 'System Settings',
      icon: 'settings',
      route: '/admin/settings',
      roles: ['ADMIN'],
      description: 'Configure corporate policies, integrations, and global parameters'
    },
    {
      title: 'Audit Logs',
      icon: 'receipt_long',
      route: '/admin/audit-logs',
      roles: ['ADMIN'],
      description: 'Review security events, access histories, and change trails'
    },
    // HR Modules
    {
      title: 'Departments',
      icon: 'domain',
      route: '/departments',
      roles: ['ADMIN', 'HR'],
      description: 'Organizational units, department heads, and operational teams'
    },
    {
      title: 'Employee Directory',
      icon: 'badge',
      route: '/employees',
      roles: ['ADMIN', 'HR'],
      description: 'View and manage all corporate staff, records, and files'
    },
    {
      title: 'Recruitment',
      icon: 'work',
      route: '/recruitment',
      roles: ['ADMIN', 'HR'],
      description: 'Manage job postings, applicant tracking, and interview pipelines'
    },
    {
      title: 'Onboarding',
      icon: 'how_to_reg',
      route: '/onboarding',
      roles: ['HR'],
      description: 'Candidate handoff, background verification, and employee activation'
    },
    {
      title: 'Leave Management',
      icon: 'event_available',
      route: '/leaves',
      roles: ['ADMIN', 'HR'],
      description: 'Corporate leave balances, time-off requests, and holiday schedules'
    },
    {
      title: 'Payroll',
      icon: 'payments',
      route: '/payroll',
      roles: ['ADMIN', 'HR'],
      description: 'Process salary disbursements, tax calculations, and benefits'
    },
    // Manager Modules
    {
      title: 'My Team',
      icon: 'groups',
      route: '/manager/team',
      roles: ['ADMIN', 'MANAGER'],
      description: 'Team rosters, direct reports, and workload distribution'
    },
    {
      title: 'Team Approvals',
      icon: 'fact_check',
      route: '/leaves',
      roles: ['ADMIN', 'MANAGER'],
      description: 'Approve or reject leave requests, expense claims, and timesheets'
    },
    {
      title: 'Performance Reviews',
      icon: 'insights',
      route: '/performance',
      roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
      description: 'Conduct quarterly appraisals, feedback cycles, and KPI tracking'
    },
    // Employee Modules
    {
      title: 'My Profile',
      icon: 'person',
      route: '/profile',
      roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
      description: 'Personal details, emergency contacts, and employment history'
    },
    {
      title: 'My Leaves',
      icon: 'flight_takeoff',
      route: '/leaves',
      roles: ['MANAGER', 'EMPLOYEE'],
      description: 'Apply for time off, check leave quotas, and view approval status'
    },
    {
      title: 'My Payslips',
      icon: 'request_quote',
      route: '/payroll',
      roles: ['MANAGER', 'EMPLOYEE'],
      description: 'View and download monthly payslips and tax withholding summaries'
    }
  ];

  private readonly _currentUser = signal<User | null>(this.getStoredUser());
  public readonly currentUser = this._currentUser.asReadonly();
  public readonly isAuthenticated = computed(() => !!this._currentUser());

  // Filtered menu items according to current user's role
  public readonly userNavItems = computed(() => {
    const user = this._currentUser();
    if (!user) return [];
    return this.allNavItems.filter(item => item.roles.includes(user.role));
  });

  /**
   * Helper to normalize roles (handles both 'ADMIN' and 'ROLE_ADMIN', etc.)
   */
  public normalizeRole(role?: string | null): UserRole {
    if (!role) return 'EMPLOYEE';
    const clean = role.replace(/^ROLE_/, '').toUpperCase();
    if (clean === 'ADMIN') return 'ADMIN';
    if (clean === 'HR') return 'HR';
    if (clean === 'MANAGER') return 'MANAGER';
    return 'EMPLOYEE';
  }

  private getStoredUser(): User | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return null;
      const user = JSON.parse(data) as User;
      if (user && user.role) {
        user.role = this.normalizeRole(user.role);
      }
      return user;
    } catch {
      return null;
    }
  }

  /**
   * Log in with username and password
   */
  public login(username: string, password: string): Observable<{ success: boolean; message?: string }> {
    const trimmedUser = username.trim();

    if (!environment.useMock) {
      return this.http.post<LoginApiResponse>(`${environment.apiUrl}/auth/login`, {
        username: trimmedUser,
        email: trimmedUser,
        password
      }).pipe(
        map(res => {
          const token = res.token || res.access_token || '';
          const role = this.normalizeRole(res.role);
          const employeeName = res.employee_name || res.username;
          const employeeId = res.employee_id != null ? Number(res.employee_id) : null;

          const user: User = {
            id: res.user_id || employeeId || res.username,
            user_id: res.user_id,
            username: res.username,
            name: employeeName,
            role,
            email: res.email || `${res.username}@hrgenius.com`,
            employee_id: employeeId,
            employee_name: employeeName,
            token
          };

          // Store auth data in localStorage
          localStorage.setItem('hrgenius_jwt_token', token);
          localStorage.setItem('token', token);
          localStorage.setItem('role', role);
          localStorage.setItem('username', res.username);
          if (employeeId != null) {
            localStorage.setItem('employee_id', String(employeeId));
          }
          if (employeeName) {
            localStorage.setItem('employee_name', employeeName);
          }
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
          this._currentUser.set(user);

          return { success: true };
        }),
        catchError(err => {
          const message = err?.error?.message || 'Invalid username or password';
          return of({ success: false, message });
        })
      );
    }

    // In-memory mock path
    const account = this.mockAccounts.find(
      acc => acc.user.username.toLowerCase() === trimmedUser.toLowerCase() ||
             (acc.user.email && acc.user.email.toLowerCase() === trimmedUser.toLowerCase())
    );

    if (!account) {
      return of({ success: false, message: 'Invalid credentials. Try admin, hr, manager, or employee (or their emails).' });
    }

    if (account.passwordHash !== password) {
      return of({ success: false, message: 'Invalid password. Hint: 123456' });
    }

    // Persist to localStorage
    const mockToken = `mock-jwt-token-${account.user.username}`;
    localStorage.setItem('hrgenius_jwt_token', mockToken);
    localStorage.setItem('token', mockToken);
    localStorage.setItem('role', account.user.role);
    localStorage.setItem('username', account.user.username);
    if (account.user.employee_id != null) {
      localStorage.setItem('employee_id', String(account.user.employee_id));
    }
    if (account.user.employee_name || account.user.name) {
      localStorage.setItem('employee_name', account.user.employee_name || account.user.name);
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(account.user));
    this._currentUser.set(account.user);

    return of({ success: true });
  }

  /**
   * Log in with Google Identity Services ID Token
   */
  public loginWithGoogle(idToken: string): Observable<{ success: boolean; message?: string }> {
    const trimmedToken = idToken.trim();

    if (!environment.useMock) {
      return this.http.post<LoginApiResponse>(`${environment.apiUrl}/auth/google`, {
        id_token: trimmedToken
      }).pipe(
        map(res => {
          const token = res.token || res.access_token || '';
          const role = this.normalizeRole(res.role);
          const employeeName = res.employee_name || res.username;
          const employeeId = res.employee_id != null ? Number(res.employee_id) : null;

          const user: User = {
            id: res.user_id || employeeId || res.username,
            user_id: res.user_id,
            username: res.username,
            name: employeeName,
            role,
            email: res.email || `${res.username}@hrgenius.com`,
            employee_id: employeeId,
            employee_name: employeeName,
            token
          };

          // Store auth data in localStorage exactly like normal login
          localStorage.setItem('hrgenius_jwt_token', token);
          localStorage.setItem('token', token);
          localStorage.setItem('role', role);
          localStorage.setItem('username', res.username);
          if (employeeId != null) {
            localStorage.setItem('employee_id', String(employeeId));
          }
          if (employeeName) {
            localStorage.setItem('employee_name', employeeName);
          }
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
          this._currentUser.set(user);

          return { success: true };
        }),
        catchError(err => {
          const message = err?.error?.message || 'Google sign-in failed. Please verify your credentials.';
          return of({ success: false, message });
        })
      );
    }

    // In-memory mock path: match first admin account
    const account = this.mockAccounts[0];
    const mockToken = `mock-google-jwt-token-${account.user.username}`;
    localStorage.setItem('hrgenius_jwt_token', mockToken);
    localStorage.setItem('token', mockToken);
    localStorage.setItem('role', account.user.role);
    localStorage.setItem('username', account.user.username);
    if (account.user.employee_id != null) {
      localStorage.setItem('employee_id', String(account.user.employee_id));
    }
    if (account.user.employee_name || account.user.name) {
      localStorage.setItem('employee_name', account.user.employee_name || account.user.name);
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(account.user));
    this._currentUser.set(account.user);

    return of({ success: true });
  }

  /**
   * Request password reset link
   */
  public forgotPassword(email: string): Observable<{ success: boolean; message: string }> {
    const trimmedEmail = email.trim().toLowerCase();
    if (!environment.useMock) {
      return this.http.post<{ success?: boolean; message?: string }>(`${environment.apiUrl}/auth/forgot-password`, {
        email: trimmedEmail
      }).pipe(
        map(res => ({
          success: true,
          message: res.message || 'If this email exists, a reset link has been sent'
        })),
        catchError(err => {
          const msg = err?.error?.message || 'If this email exists, a reset link has been sent';
          return of({ success: false, message: msg });
        })
      );
    }

    // Mock mode
    return of({
      success: true,
      message: 'If this email exists, a reset link has been sent'
    });
  }

  /**
   * Reset password using token and new password
   */
  public resetPassword(token: string, newPassword: string): Observable<{ success: boolean; message: string }> {
    if (!environment.useMock) {
      return this.http.post<{ success?: boolean; message?: string }>(`${environment.apiUrl}/auth/reset-password`, {
        token: token.trim(),
        new_password: newPassword
      }).pipe(
        map(res => ({
          success: true,
          message: res.message || 'Password has been reset successfully'
        })),
        catchError(err => {
          const msg = err?.error?.message || 'Invalid or expired password reset token';
          return of({ success: false, message: msg });
        })
      );
    }

    // Mock mode
    return of({
      success: true,
      message: 'Password has been reset successfully'
    });
  }

  /**
   * Log out the current user and redirect to /login
   */
  public logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem('hrgenius_jwt_token');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('employee_id');
    localStorage.removeItem('employee_name');
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }

  /**
   * Check if user has one of required roles
   */
  public hasRole(roles: UserRole[]): boolean {
    const user = this._currentUser();
    if (!user) return false;
    return roles.includes(this.normalizeRole(user.role));
  }
}

