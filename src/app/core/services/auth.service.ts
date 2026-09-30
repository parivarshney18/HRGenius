import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { User, UserRole, NavItem } from '../models/user.model';

interface MockAccount {
  user: User;
  passwordHash: string; // "123456"
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly router = inject(Router);
  private readonly STORAGE_KEY = 'hrgenius_auth_user';

  // Mock users per requirements
  private readonly mockAccounts: MockAccount[] = [
    {
      user: {
        id: 'u-admin-1',
        username: 'admin',
        name: 'Alex Mercer',
        role: 'ADMIN',
        email: 'alex.admin@hrgenius.com',
        department: 'Information Technology',
        title: 'System Administrator'
      },
      passwordHash: '123456'
    },
    {
      user: {
        id: 'u-hr-2',
        username: 'hr',
        name: 'Sarah Jenkins',
        role: 'HR',
        email: 'sarah.hr@hrgenius.com',
        department: 'Human Resources',
        title: 'HR Operations Lead'
      },
      passwordHash: '123456'
    },
    {
      user: {
        id: 'u-mgr-3',
        username: 'manager',
        name: 'Marcus Vance',
        role: 'MANAGER',
        email: 'marcus.mgr@hrgenius.com',
        department: 'Engineering',
        title: 'Engineering Manager'
      },
      passwordHash: '123456'
    },
    {
      user: {
        id: 'u-emp-4',
        username: 'employee',
        name: 'Elena Rostova',
        role: 'EMPLOYEE',
        email: 'elena.emp@hrgenius.com',
        department: 'Product Design',
        title: 'UI/UX Designer'
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
      title: 'Employee Directory',
      icon: 'badge',
      route: '/hr/employees',
      roles: ['ADMIN', 'HR'],
      description: 'View and manage all corporate staff, records, and files'
    },
    {
      title: 'Recruitment',
      icon: 'work',
      route: '/hr/recruitment',
      roles: ['ADMIN', 'HR'],
      description: 'Manage job postings, applicant tracking, and interview pipelines'
    },
    {
      title: 'Leave & Attendance',
      icon: 'event_available',
      route: '/hr/leaves',
      roles: ['ADMIN', 'HR'],
      description: 'Corporate leave balances, timesheets, and holiday schedules'
    },
    {
      title: 'Payroll',
      icon: 'payments',
      route: '/hr/payroll',
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
      route: '/manager/approvals',
      roles: ['ADMIN', 'MANAGER'],
      description: 'Approve or reject leave requests, expense claims, and timesheets'
    },
    {
      title: 'Performance Reviews',
      icon: 'insights',
      route: '/manager/performance',
      roles: ['ADMIN', 'MANAGER'],
      description: 'Conduct quarterly appraisals, feedback cycles, and KPI tracking'
    },
    // Employee Modules
    {
      title: 'My Profile',
      icon: 'person',
      route: '/employee/profile',
      roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
      description: 'Personal details, emergency contacts, and employment history'
    },
    {
      title: 'My Leaves',
      icon: 'flight_takeoff',
      route: '/employee/my-leaves',
      roles: ['MANAGER', 'EMPLOYEE'],
      description: 'Apply for time off, check leave quotas, and view approval status'
    },
    {
      title: 'My Payslips',
      icon: 'request_quote',
      route: '/employee/my-payslips',
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

  private getStoredUser(): User | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? (JSON.parse(data) as User) : null;
    } catch {
      return null;
    }
  }

  /**
   * Log in with username and password
   */
  public login(username: string, password: string): { success: boolean; message?: string } {
    const trimmedUser = username.trim().toLowerCase();
    const account = this.mockAccounts.find(
      acc => acc.user.username.toLowerCase() === trimmedUser
    );

    if (!account) {
      return { success: false, message: 'Invalid username. Try admin, hr, manager, or employee.' };
    }

    if (account.passwordHash !== password) {
      return { success: false, message: 'Invalid password. Hint: 123456' };
    }

    // Persist to localStorage
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(account.user));
    this._currentUser.set(account.user);

    return { success: true };
  }

  /**
   * Log out the current user and redirect to /login
   */
  public logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }

  /**
   * Check if user has one of required roles
   */
  public hasRole(roles: UserRole[]): boolean {
    const user = this._currentUser();
    if (!user) return false;
    return roles.includes(user.role);
  }
}
