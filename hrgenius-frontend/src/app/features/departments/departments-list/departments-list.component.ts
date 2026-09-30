import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Department } from '../../../core/models/department.model';
import { DepartmentService } from '../../../core/services/department.service';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { TableColumn, TableAction } from '../../../shared/components/data-table/data-table.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { DepartmentDialogComponent } from '../department-dialog/department-dialog.component';

@Component({
  selector: 'app-departments-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    DataTableComponent
  ],
  templateUrl: './departments-list.component.html',
  styleUrl: './departments-list.component.scss'
})
export class DepartmentsListComponent implements OnInit {
  private readonly departmentService = inject(DepartmentService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  public readonly departments = signal<Department[]>([]);
  public readonly isLoading = signal<boolean>(true);

  public readonly activeCount = computed(() =>
    this.departments().filter(d => d.status.toLowerCase() === 'active').length
  );

  public readonly inactiveCount = computed(() =>
    this.departments().filter(d => d.status.toLowerCase() !== 'active').length
  );

  public readonly columns: TableColumn<Department>[] = [
    {
      key: 'department_id',
      header: 'ID',
      sortable: true,
      width: '80px',
      cell: (row) => `#${row.department_id}`
    },
    {
      key: 'department_name',
      header: 'Department Name',
      sortable: true,
      width: '240px'
    },
    {
      key: 'department_head',
      header: 'Department Head',
      sortable: true,
      width: '180px'
    },
    {
      key: 'description',
      header: 'Description & Scope',
      sortable: true
    },
    {
      key: 'status',
      header: 'Status',
      type: 'badge',
      sortable: true,
      width: '120px',
      badgeConfig: {
        'Active': { bg: '#dcfce7', color: '#15803d', border: '#86efac' },
        'Inactive': { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' }
      }
    }
  ];

  public readonly actions: TableAction<Department>[] = [
    {
      name: 'edit',
      icon: 'edit',
      color: 'primary',
      tooltip: 'Edit Department'
    },
    {
      name: 'delete',
      icon: 'delete',
      color: 'warn',
      tooltip: 'Delete Department'
    }
  ];

  ngOnInit(): void {
    this.loadDepartments();
  }

  public loadDepartments(): void {
    this.isLoading.set(true);
    this.departmentService.getAll().subscribe({
      next: (data) => {
        this.departments.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.snackBar.open('Failed to load departments', 'Dismiss', { duration: 3000 });
      }
    });
  }

  public openCreateDialog(): void {
    const dialogRef = this.dialog.open(DepartmentDialogComponent, {
      width: '540px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe((result: Department | null) => {
      if (result) {
        this.snackBar.open(`Department "${result.department_name}" created successfully.`, 'Dismiss', {
          duration: 3500
        });
        this.loadDepartments();
      }
    });
  }

  public handleActionClick(event: { action: string; row: Department }): void {
    if (event.action === 'edit') {
      this.openEditDialog(event.row);
    } else if (event.action === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  private openEditDialog(department: Department): void {
    const dialogRef = this.dialog.open(DepartmentDialogComponent, {
      width: '540px',
      data: {
        mode: 'edit',
        department: { ...department }
      }
    });

    dialogRef.afterClosed().subscribe((result: Department | null) => {
      if (result) {
        this.snackBar.open(`Department "${result.department_name}" updated successfully.`, 'Dismiss', {
          duration: 3500
        });
        this.loadDepartments();
      }
    });
  }

  private confirmDelete(department: Department): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Department',
        message: `Are you sure you want to delete "${department.department_name}"? All assigned personnel and role mappings may be affected.`,
        confirmText: 'Delete Department',
        cancelText: 'Cancel',
        confirmColor: 'warn',
        icon: 'warning'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.isLoading.set(true);
        this.departmentService.delete(department.department_id).subscribe({
          next: () => {
            this.snackBar.open(`Department "${department.department_name}" was deleted.`, 'Dismiss', {
              duration: 3500
            });
            this.loadDepartments();
          },
          error: (err) => {
            this.isLoading.set(false);
            this.snackBar.open(err?.message || 'Failed to delete department', 'Dismiss', {
              duration: 3500
            });
          }
        });
      }
    });
  }
}
