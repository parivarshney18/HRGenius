import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Onboarding } from '../models/onboarding.model';
import { Employee } from '../models/employee.model';
import { EmployeeService } from './employee.service';
import { CandidateService } from './candidate.service';
import { environment } from '../../../environments/environment';

export interface CompleteOnboardingPayload {
  onboarding_id: string | number;
  candidate_id: string | number;
  joining_date: string;
  document_status: string;
  verification_status: string;
  assigned_department: string | number;
  assigned_manager: string | number;
  designation: string;
  phone?: string;
  address?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/onboarding`;
  private readonly employeeService = inject(EmployeeService);
  private readonly candidateService = inject(CandidateService);

  // In-memory mock onboarding items for selected candidates
  private onboardings: Onboarding[] = [
    {
      onboarding_id: 1,
      candidate_id: 4, // Emily Vance (Selected for Senior Frontend Engineer)
      employee_id: null,
      joining_date: '2026-10-15',
      document_status: 'Submitted',
      verification_status: 'In Progress',
      assigned_department: 1, // Engineering & Technology
      assigned_manager: 4, // Marcus Vance
      onboarding_status: 'Pending'
    },
    {
      onboarding_id: 2,
      candidate_id: 10, // Linda Wang (Selected for Senior Financial Analyst)
      employee_id: null,
      joining_date: '2026-11-01',
      document_status: 'Verified',
      verification_status: 'Passed',
      assigned_department: 3, // Finance & Accounting
      assigned_manager: 3, // Robert Sterling
      onboarding_status: 'Pending'
    },
    {
      onboarding_id: 3,
      candidate_id: 12, // Hannah Abbott (Product Marketing)
      employee_id: null,
      joining_date: '2026-10-20',
      document_status: 'Pending',
      verification_status: 'Pending',
      assigned_department: 4, // Marketing & Brand
      assigned_manager: 11, // Maya Patel
      onboarding_status: 'Pending'
    }
  ];

  /**
   * Retrieve all onboarding records
   */
  public getAll(): Observable<Onboarding[]> {
    if (!environment.useMock) {
      return this.http.get<Onboarding[]>(this.apiUrl);
    }
    return of([...this.onboardings]).pipe(delay(250));
  }

  /**
   * Retrieve onboarding record by ID
   */
  public getById(id: string | number): Observable<Onboarding | undefined> {
    if (!environment.useMock) {
      return this.http.get<Onboarding>(`${this.apiUrl}/${id}`);
    }
    const item = this.onboardings.find(o => String(o.onboarding_id) === String(id));
    return of(item ? { ...item } : undefined).pipe(delay(200));
  }

  /**
   * Create an onboarding entry for a candidate
   */
  public create(entry: Omit<Onboarding, 'onboarding_id'>): Observable<Onboarding> {
    if (!environment.useMock) {
      return this.http.post<Onboarding>(this.apiUrl, entry);
    }
    const nextId = this.onboardings.length > 0
      ? Math.max(...this.onboardings.map(o => Number(o.onboarding_id) || 0)) + 1
      : 1;

    const newRecord: Onboarding = {
      ...entry,
      onboarding_id: nextId
    };

    this.onboardings = [newRecord, ...this.onboardings];
    return of({ ...newRecord }).pipe(delay(300));
  }

  /**
   * Update an existing onboarding record
   */
  public update(id: string | number, changes: Partial<Onboarding>): Observable<Onboarding> {
    if (!environment.useMock) {
      return this.http.put<Onboarding>(`${this.apiUrl}/${id}`, changes);
    }
    const index = this.onboardings.findIndex(o => String(o.onboarding_id) === String(id));
    if (index === -1) {
      throw new Error(`Onboarding record with ID ${id} not found.`);
    }

    const updated: Onboarding = {
      ...this.onboardings[index],
      ...changes,
      onboarding_id: this.onboardings[index].onboarding_id
    };

    this.onboardings[index] = updated;
    this.onboardings = [...this.onboardings];
    return of({ ...updated }).pipe(delay(300));
  }

  /**
   * Complete onboarding:
   * 1. Creates a new Employee record in EmployeeService
   * 2. Marks onboarding record as 'Completed' and links employee_id
   */
  public completeOnboarding(payload: CompleteOnboardingPayload): Observable<{ employee: Employee; onboarding: Onboarding }> {
    if (!environment.useMock) {
      return this.http.post<{ employee: Employee; onboarding: Onboarding }>(`${this.apiUrl}/complete`, payload);
    }
    return this.candidateService.getById(payload.candidate_id).pipe(
      switchMap((cand) => {
        const candidateName = cand?.candidate_name || 'New Hire';
        const nameParts = candidateName.split(' ');
        const firstName = nameParts[0] || 'New';
        const lastName = nameParts.slice(1).join(' ') || 'Employee';
        const email = cand?.candidate_email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@hrgenius.com`;

        // Construct new Employee record
        const newEmployeeData: Omit<Employee, 'employee_id'> = {
          employee_code: '', // EmployeeService will auto-generate EMP-XXX
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: payload.phone || '+1 (555) 987-6543',
          gender: 'Other',
          date_of_birth: '1995-05-15',
          address: payload.address || '777 Enterprise Way, Suite 400, New York, NY',
          date_of_joining: payload.joining_date,
          department_id: Number(payload.assigned_department),
          manager_id: payload.assigned_manager ? Number(payload.assigned_manager) : null,
          designation: payload.designation || 'Associate Specialist',
          employment_type: 'Full-Time',
          status: 'Active'
        };

        return this.employeeService.create(newEmployeeData).pipe(
          switchMap((createdEmployee) => {
            // Update the onboarding record to completed and store employee_id
            return this.update(payload.onboarding_id, {
              joining_date: payload.joining_date,
              document_status: payload.document_status,
              verification_status: payload.verification_status,
              assigned_department: payload.assigned_department,
              assigned_manager: payload.assigned_manager,
              onboarding_status: 'Completed',
              employee_id: createdEmployee.employee_id
            }).pipe(
              switchMap((updatedOnboarding) => {
                return of({ employee: createdEmployee, onboarding: updatedOnboarding });
              })
            );
          })
        );
      })
    );
  }

  /**
   * Delete an onboarding entry
   */
  public delete(id: string | number): Observable<boolean> {
    if (!environment.useMock) {
      return this.http.delete<boolean>(`${this.apiUrl}/${id}`);
    }
    const index = this.onboardings.findIndex(o => String(o.onboarding_id) === String(id));
    if (index !== -1) {
      this.onboardings.splice(index, 1);
      this.onboardings = [...this.onboardings];
      return of(true).pipe(delay(300));
    }
    return of(false).pipe(delay(200));
  }
}
