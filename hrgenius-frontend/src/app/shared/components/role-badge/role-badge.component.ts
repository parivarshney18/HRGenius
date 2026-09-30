import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-role-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './role-badge.component.html',
  styleUrl: './role-badge.component.scss'
})
export class RoleBadgeComponent {
  role = input.required<UserRole | undefined>();
}
