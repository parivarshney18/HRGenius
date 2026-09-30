export interface Job {
  job_id: string | number;
  job_title: string;
  department_id: string | number;
  description: string;
  requirements: string;
  openings: number;
  posting_date: string;
  closing_date: string;
}
