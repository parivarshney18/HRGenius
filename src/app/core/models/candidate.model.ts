export interface Candidate {
  candidate_id: string | number;
  job_id: string | number;
  candidate_name: string;
  candidate_email: string;
  resume: string;
  application_date: string;
  application_status: string;
  interview_date?: string | null;
  interview_result?: string | null;
}
