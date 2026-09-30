export interface DashboardStats {
  total_employees: number;
  new_hires: number;
  open_positions: number;
  pending_leaves: number;
  department_wise_headcount: Record<string, number>;
  attendance_summary: Record<string, number>;
  leave_summary: Record<string, number>;
  recruitment_funnel: Record<string, number>;
  payroll_summary: any;
  rating_distribution: Record<string, number>;
}
