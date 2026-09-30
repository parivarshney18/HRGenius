import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { UserRole } from '../../core/models/user.model';
import { RoleBadgeComponent } from '../../shared/components/role-badge/role-badge.component';

@Component({
  selector: 'app-module-placeholder',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTableModule,
    RoleBadgeComponent
  ],
  templateUrl: './module-placeholder.component.html',
  styleUrl: './module-placeholder.component.scss'
})
export class ModulePlaceholderComponent {
  private readonly route = inject(ActivatedRoute);

  public readonly title = this.route.snapshot.data['title'] || 'Module View';
  public readonly icon = this.route.snapshot.data['icon'] || 'widgets';
  public readonly description = this.route.snapshot.data['description'] || 'Module overview and settings';
  public readonly category = this.route.snapshot.data['category'] || 'Operations';
  public readonly roles = (this.route.snapshot.data['roles'] || []) as UserRole[];

  // Mock table data to give a realistic enterprise UI placeholder
  public readonly mockRecords = [
    { id: 'REC-101', name: 'Standard Configuration', status: 'Active', updated: 'Today, 08:30 AM', priority: 'Normal' },
    { id: 'REC-102', name: 'Q3 Policy Alignment', status: 'In Review', updated: 'Yesterday', priority: 'High' },
    { id: 'REC-103', name: 'Compliance Verification', status: 'Completed', updated: '2 days ago', priority: 'Low' },
    { id: 'REC-104', name: 'Operational Sync Point', status: 'Active', updated: '3 days ago', priority: 'Normal' }
  ];

  public readonly displayedColumns: string[] = ['id', 'name', 'status', 'priority', 'updated', 'actions'];
}
