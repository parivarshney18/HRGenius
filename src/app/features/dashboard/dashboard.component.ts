import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';
import { RoleBadgeComponent } from '../../shared/components/role-badge/role-badge.component';

interface StatCard {
  label: string;
  value: string;
  icon: string;
  color: string;
  trend?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    RoleBadgeComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  public readonly authService = inject(AuthService);
  public readonly currentUser = this.authService.currentUser;
  public readonly userNavItems = this.authService.userNavItems;

  public readonly roleMetrics = computed<StatCard[]>(() => {
    const role = this.currentUser()?.role;
    switch (role) {
      case 'ADMIN':
        return [
          { label: 'Total Users', value: '1,280', icon: 'people', color: '#3b82f6', trend: '+12 this week' },
          { label: 'System Uptime', value: '99.98%', icon: 'cloud_done', color: '#10b981', trend: 'Healthy' },
          { label: 'Audit Logs', value: '4,892', icon: 'receipt_long', color: '#f59e0b', trend: '3 security alerts' },
          { label: 'Active Roles', value: '4 Defined', icon: 'admin_panel_settings', color: '#ef4444', trend: 'RBAC active' }
        ];
      case 'HR':
        return [
          { label: 'Active Employees', value: '452', icon: 'badge', color: '#3b82f6', trend: '+6 new hires' },
          { label: 'Open Positions', value: '18', icon: 'work', color: '#8b5cf6', trend: '4 interviews today' },
          { label: 'Pending Leaves', value: '14', icon: 'event_busy', color: '#f59e0b', trend: 'Action required' },
          { label: 'Payroll Status', value: 'Disbursed', icon: 'payments', color: '#10b981', trend: 'Current cycle OK' }
        ];
      case 'MANAGER':
        return [
          { label: 'Direct Reports', value: '8 Members', icon: 'groups', color: '#3b82f6', trend: 'All active' },
          { label: 'Pending Approvals', value: '3 Requests', icon: 'fact_check', color: '#f59e0b', trend: '2 leaves, 1 expense' },
          { label: 'Sprint Reviews', value: '85%', icon: 'insights', color: '#10b981', trend: 'On track' },
          { label: 'Team Attendance', value: '100%', icon: 'check_circle', color: '#06b6d4', trend: 'Today' }
        ];
      case 'EMPLOYEE':
      default:
        return [
          { label: 'Annual Leave Balance', value: '18 Days', icon: 'beach_access', color: '#3b82f6', trend: 'Expires Dec 31' },
          { label: 'Next Payday', value: 'Oct 15', icon: 'calendar_month', color: '#10b981', trend: 'In 15 days' },
          { label: 'Assigned Tasks', value: '5 Pending', icon: 'task', color: '#8b5cf6', trend: '2 due today' },
          { label: 'Performance Rating', value: '4.8 / 5.0', icon: 'star', color: '#f59e0b', trend: 'Exceeds expectations' }
        ];
    }
  });
}
