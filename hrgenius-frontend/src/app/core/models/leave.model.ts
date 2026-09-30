export interface Leave {
  leave_id: string | number;
  employee_id: string | number;
  leave_type: string;
  start_date: string;
  end_date: string;
  number_of_days: number;
  reason: string;
  applied_date: string;
  approved_by?: string | number | null;
  approval_date?: string | null;
  leave_status: string;
}
