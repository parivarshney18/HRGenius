import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { LayoutComponent } from './features/layout/layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ModulePlaceholderComponent } from './features/placeholder/module-placeholder.component';
import { DepartmentsListComponent } from './features/departments/departments-list/departments-list.component';
import { EmployeeListComponent } from './features/employees/employee-list/employee-list.component';
import { EmployeeFormComponent } from './features/employees/employee-form/employee-form.component';
import { EmployeeDetailComponent } from './features/employees/employee-detail/employee-detail.component';
import { JobListComponent } from './features/recruitment/job-list/job-list.component';
import { CandidateListComponent } from './features/recruitment/candidate-list/candidate-list.component';
import { OnboardingListComponent } from './features/onboarding/onboarding-list/onboarding-list.component';
import { AttendanceComponent } from './features/attendance/attendance.component';
import { LeavesComponent } from './features/leaves/leaves.component';
import { PayrollComponent } from './features/payroll/payroll.component';
import { PerformanceComponent } from './features/performance/performance.component';
import { ProfileComponent } from './features/profile/profile.component';
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
        path: 'departments',
        component: DepartmentsListComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN', 'HR'],
          title: 'Departments',
          icon: 'domain',
          category: 'HR Management',
          description: 'Corporate organizational units, department heads, and status'
        }
      },
      {
        path: 'hr/departments',
        redirectTo: 'departments',
        pathMatch: 'full'
      },
      // Employees Module
      {
        path: 'employees',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'HR'] },
        children: [
          {
            path: '',
            component: EmployeeListComponent,
            data: {
              roles: ['ADMIN', 'HR'],
              title: 'Employee Directory',
              icon: 'badge'
            }
          },
          {
            path: 'new',
            component: EmployeeFormComponent,
            data: {
              roles: ['ADMIN', 'HR'],
              title: 'Add Employee',
              icon: 'person_add'
            }
          },
          {
            path: ':id',
            component: EmployeeDetailComponent,
            data: {
              roles: ['ADMIN', 'HR'],
              title: 'Employee Profile',
              icon: 'badge'
            }
          },
          {
            path: ':id/edit',
            component: EmployeeFormComponent,
            data: {
              roles: ['ADMIN', 'HR'],
              title: 'Edit Employee',
              icon: 'edit'
            }
          }
        ]
      },
      {
        path: 'hr/employees',
        redirectTo: 'employees',
        pathMatch: 'full'
      },
      // Recruitment Module
      {
        path: 'recruitment',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'HR'] },
        children: [
          {
            path: '',
            component: JobListComponent,
            data: {
              roles: ['ADMIN', 'HR'],
              title: 'Recruitment & Job Openings',
              icon: 'work'
            }
          },
          {
            path: 'jobs/:jobId/candidates',
            component: CandidateListComponent,
            data: {
              roles: ['ADMIN', 'HR'],
              title: 'Candidate Pipeline',
              icon: 'groups'
            }
          }
        ]
      },
      {
        path: 'hr/recruitment',
        redirectTo: 'recruitment',
        pathMatch: 'full'
      },
      // Onboarding Module (HR only)
      {
        path: 'onboarding',
        component: OnboardingListComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['HR'],
          title: 'Onboarding',
          icon: 'how_to_reg',
          category: 'HR Management',
          description: 'Employee onboarding, background verification, and employee creation'
        }
      },
      {
        path: 'hr/onboarding',
        redirectTo: 'onboarding',
        pathMatch: 'full'
      },
      // Attendance Module (accessible to all roles: ADMIN, HR, MANAGER, EMPLOYEE)
      {
        path: 'attendance',
        component: AttendanceComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
          title: 'Attendance & Time Tracking',
          icon: 'schedule',
          category: 'Time & Attendance',
          description: 'Employee punch in/out, shift records, and team attendance oversight'
        }
      },
      {
        path: 'hr/attendance',
        redirectTo: 'attendance',
        pathMatch: 'full'
      },
      {
        path: 'manager/attendance',
        redirectTo: 'attendance',
        pathMatch: 'full'
      },
      {
        path: 'employee/attendance',
        redirectTo: 'attendance',
        pathMatch: 'full'
      },
      // Leaves Module
      {
        path: 'leaves',
        component: LeavesComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
          title: 'Leave Management',
          icon: 'event_available',
          category: 'Time & Attendance',
          description: 'Apply for leaves, track balances, and manage organizational approvals'
        }
      },
      {
        path: 'hr/leaves',
        redirectTo: 'leaves',
        pathMatch: 'full'
      },
      {
        path: 'employee/my-leaves',
        redirectTo: 'leaves',
        pathMatch: 'full'
      },
      {
        path: 'manager/approvals',
        redirectTo: 'leaves',
        pathMatch: 'full'
      },

      // Payroll Module
      {
        path: 'payroll',
        component: PayrollComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
          title: 'Payroll Management',
          icon: 'payments',
          category: 'Finance & Compensation',
          description: 'Process monthly salaries, calculate statutory taxes, and view paystubs'
        }
      },
      {
        path: 'hr/payroll',
        redirectTo: 'payroll',
        pathMatch: 'full'
      },
      {
        path: 'employee/my-payslips',
        redirectTo: 'payroll',
        pathMatch: 'full'
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

      // Performance Module
      {
        path: 'performance',
        component: PerformanceComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
          title: 'Performance Reviews',
          icon: 'insights',
          category: 'Performance',
          description: 'Quarterly appraisals, KPI goal tracking, and review feedback'
        }
      },
      {
        path: 'manager/performance',
        redirectTo: 'performance',
        pathMatch: 'full'
      },

      // Profile Module
      {
        path: 'profile',
        component: ProfileComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
          title: 'My Profile',
          icon: 'person',
          category: 'Employee Self-Service',
          description: 'Personal details, employment history, and compensation overview'
        }
      },
      {
        path: 'employee/profile',
        redirectTo: 'profile',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
