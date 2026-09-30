export type ColumnType = 'text' | 'number' | 'currency' | 'date' | 'badge' | 'custom';

export interface BadgeStyle {
  bg?: string;
  color?: string;
  border?: string;
}

export interface TableColumn<T = any> {
  key: string;
  header: string;
  sortable?: boolean;
  type?: ColumnType;
  pipeFormat?: string; // e.g. 'yyyy-MM-dd' or 'USD'
  badgeConfig?: Record<string, BadgeStyle>;
  cell?: (row: T) => any;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface TableAction<T = any> {
  name: string;
  icon: string;
  label?: string;
  color?: 'primary' | 'accent' | 'warn';
  tooltip?: string;
  visible?: (row: T) => boolean;
}
