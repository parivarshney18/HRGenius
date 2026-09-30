export interface Attendance {
  attendance_id: string | number;
  employee_id: string | number;
  attendance_date: string;
  check_in?: string | null;
  check_out?: string | null;
  attendance_status: string;
  working_hours?: number | null;
  remarks?: string | null;
}
