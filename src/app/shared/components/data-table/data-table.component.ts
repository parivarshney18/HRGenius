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

  public getBadgeStyle(value: any, col: TableColumn<T>): BadgeStyle {
    if (col.badgeConfig && col.badgeConfig[value]) {
      return col.badgeConfig[value];
    }
    return {
      bg: '#f1f5f9',
      color: '#475569',
      border: '#cbd5e1'
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
