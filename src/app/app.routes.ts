import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { LayoutComponent } from './features/layout/layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ModulePlaceholderComponent } from './features/placeholder/module-placeholder.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      // Admin Modules
      {
        path: 'admin/users',
        component: ModulePlaceholderComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN'],
          title: 'User Management',
          icon: 'manage_accounts',
          category: 'Admin Operations',
          description: 'Manage employee accounts, system permissions, and credential policies'
        }
      },
      {
        path: 'admin/settings',
        component: ModulePlaceholderComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN'],
          title: 'System Settings',
          icon: 'settings',
          category: 'Admin Operations',
          description: 'Configure corporate parameters, security policies, and third-party integrations'
        }
      },
      {
        path: 'admin/audit-logs',
        component: ModulePlaceholderComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN'],
          title: 'Audit Logs',
          icon: 'receipt_long',
          category: 'Admin Operations',
          description: 'Inspect security audit records, authentication history, and administrative actions'
        }
      },
      // HR Modules
      {
        path: 'hr/employees',
        component: ModulePlaceholderComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN', 'HR'],
          title: 'Employee Directory',
          icon: 'badge',
          category: 'HR Management',
          description: 'Company-wide employee directory, service contracts, and personnel documentation'
        }
      },
      {
        path: 'hr/recruitment',
        component: ModulePlaceholderComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN', 'HR'],
          title: 'Recruitment & Job Openings',
          icon: 'work',
          category: 'HR Management',
          description: 'Active requisitions, candidate pipeline, and scheduled interviews'
        }
      },
      {
        path: 'hr/leaves',
        component: ModulePlaceholderComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN', 'HR'],
          title: 'Leave & Attendance Tracking',
          icon: 'event_available',
          category: 'HR Management',
          description: 'Annual leave allocations, company holidays, and time-tracking reviews'
        }
      },
      {
        path: 'hr/payroll',
        component: ModulePlaceholderComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN', 'HR'],
          title: 'Payroll Management',
          icon: 'payments',
          category: 'HR Management',
          description: 'Monthly payroll runs, statutory deductions, bonuses, and tax forms'
        }
      },
      // Manager Modules
      {
        path: 'manager/team',
        component: ModulePlaceholderComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN', 'MANAGER'],
          title: 'My Team',
          icon: 'groups',
          category: 'Manager Hub',
          description: 'Direct reports overview, attendance, team allocation, and contact info'
        }
      },
      {
        path: 'manager/approvals',
        component: ModulePlaceholderComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN', 'MANAGER'],
          title: 'Team Approvals',
          icon: 'fact_check',
          category: 'Manager Hub',
          description: 'Pending leave requests, expense submissions, and shift approvals'
        }
      },
      {
        path: 'manager/performance',
        component: ModulePlaceholderComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN', 'MANAGER'],
          title: 'Performance Reviews',
          icon: 'insights',
          category: 'Manager Hub',
          description: 'Appraisal cycles, KPI tracking, and peer review submissions'
        }
      },
      // Employee Modules
      {
        path: 'employee/profile',
        component: ModulePlaceholderComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
          title: 'My Profile',
          icon: 'person',
          category: 'Employee Self-Service',
          description: 'Personal details, home address, emergency contacts, and documents'
        }
      },
      {
        path: 'employee/my-leaves',
        component: ModulePlaceholderComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['MANAGER', 'EMPLOYEE'],
          title: 'My Leaves',
          icon: 'flight_takeoff',
          category: 'Employee Self-Service',
          description: 'Request time off, view approved leaves, and check holiday balances'
        }
      },
      {
        path: 'employee/my-payslips',
        component: ModulePlaceholderComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['MANAGER', 'EMPLOYEE'],
          title: 'My Payslips',
          icon: 'request_quote',
          category: 'Employee Self-Service',
          description: 'Monthly pay stubs, income tax breakdowns, and payment history'
        }
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
