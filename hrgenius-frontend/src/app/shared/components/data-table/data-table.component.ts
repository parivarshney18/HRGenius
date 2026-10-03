import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TableColumn, TableAction, BadgeStyle } from './data-table.model';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableComponent<T = any> implements AfterViewInit, OnChanges {
  @Input() data: T[] = [];
  @Input() columns: TableColumn<T>[] = [];
  @Input() actions: TableAction<T>[] = [];
  @Input() title?: string;
  @Input() searchPlaceholder = 'Search records...';
  @Input() showSearch = true;
  @Input() pageSize = 10;
  @Input() pageSizeOptions: number[] = [5, 10, 25, 50];

  @Output() actionClick = new EventEmitter<{ action: string; row: T }>();
  @Output() rowClick = new EventEmitter<T>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  public dataSource = new MatTableDataSource<T>([]);
  public searchTerm = '';

  get displayedColumns(): string[] {
    const cols = this.columns.map(c => c.key);
    if (this.actions && this.actions.length > 0) {
      cols.push('__actions');
    }
    return cols;
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.dataSource.data = this.data || [];
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
    }
  }

  public applyFilter(value: string): void {
    this.searchTerm = value;
    this.dataSource.filter = value.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  public clearFilter(): void {
    this.applyFilter('');
  }

  public getCellValue(row: T, col: TableColumn<T>): any {
    if (col.cell) {
      return col.cell(row);
    }
    return (row as any)[col.key];
  }

  public getBadgeIcon(value: any): string {
    if (!value) return '';
    const str = String(value).toUpperCase();
    if (['ACTIVE', 'APPROVED', 'PRESENT', 'PROCESSED', 'SELECTED', 'PAID', 'COMPLETED', 'PASSED', 'VERIFIED'].includes(str)) {
      return 'check_circle';
    }
    if (['PENDING', 'DRAFT', 'SHORTLISTED', 'APPLIED', 'IN_PROGRESS', 'IN PROGRESS', 'SUBMITTED', 'OPEN', 'SCREENED'].includes(str)) {
      return 'schedule';
    }
    if (['INACTIVE', 'REJECTED', 'ABSENT', 'CANCELLED', 'TERMINATED', 'CLOSED', 'FAILED'].includes(str)) {
      return 'cancel';
    }
    if (['LATE', 'ON_HOLD', 'WARNING'].includes(str)) {
      return 'warning';
    }
    if (['HALF-DAY', 'HALF_DAY', 'ON_LEAVE'].includes(str)) {
      return 'timelapse';
    }
    return 'label';
  }

  public getBadgeStyle(value: any, col: TableColumn<T>): BadgeStyle {
    const str = String(value || '').toUpperCase();
    if (['ACTIVE', 'APPROVED', 'PRESENT', 'PROCESSED', 'SELECTED', 'PAID', 'COMPLETED', 'PASSED', 'VERIFIED'].includes(str)) {
      return {
        bg: 'var(--accent-soft-2)',
        color: 'var(--accent-strong)',
        border: 'var(--accent-soft-2)'
      };
    }
    if (['PENDING', 'DRAFT', 'SHORTLISTED', 'APPLIED', 'IN_PROGRESS', 'IN PROGRESS', 'SUBMITTED', 'OPEN', 'SCREENED'].includes(str)) {
      return {
        bg: 'transparent',
        color: 'var(--text)',
        border: 'var(--border)'
      };
    }
    if (['INACTIVE', 'REJECTED', 'ABSENT', 'CANCELLED', 'TERMINATED', 'CLOSED', 'FAILED'].includes(str)) {
      return {
        bg: 'var(--surface-2)',
        color: 'var(--muted)',
        border: 'var(--border-subtle)'
      };
    }
    return {
      bg: 'var(--surface-2)',
      color: 'var(--text)',
      border: 'var(--border)'
    };
  }

  public onAction(action: string, row: T, event: Event): void {
    event.stopPropagation();
    this.actionClick.emit({ action, row });
  }

  public onRowClick(row: T): void {
    this.rowClick.emit(row);
  }
}
