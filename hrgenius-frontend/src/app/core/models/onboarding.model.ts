export interface Onboarding {
  onboarding_id: string | number;
  candidate_id: string | number;
  employee_id?: string | number | null;
  joining_date: string;
  document_status: string;
  verification_status: string;
  assigned_department: string | number;
  assigned_manager: string | number;
  onboarding_status: string;
}
