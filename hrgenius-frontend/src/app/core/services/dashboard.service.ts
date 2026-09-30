import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { DashboardStats } from '../models/dashboard.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  private readonly mockStats: DashboardStats = {
    total_employees: 70,
    new_hires: 12,
    open_positions: 15,
    pending_leaves: 8,
    department_wise_headcount: {
      'Engineering': 22,
      'Human Resources': 6,
      'Finance': 8,
      'Sales': 10,
      'Marketing': 7,
      'Operations': 8,
      'IT Support': 5,
      'Legal': 4
    },
    attendance_summary: {
      'Present': 50,
      'Late': 12,
      'Half-day': 10,
      'Absent': 8
    },
    leave_summary: {
      'APPROVED': 35,
      'PENDING': 20,
      'REJECTED': 10
    },
    recruitment_funnel: {
      'Applied': 25,
      'Shortlisted': 20,
      'Interviewed': 15,
      'Selected': 15
    },
    payroll_summary: {
      'total_gross': 450000,
      'total_net': 365000,
      'total_deductions': 85000
    },
    rating_distribution: {
      '5': 15,
      '4': 25,
      '3': 12,
      '2': 5,
      '1': 3
    }
  };

  /**
   * Retrieve aggregated dashboard metrics and chart datasets
   */
  public getStats(): Observable<DashboardStats> {
    if (!environment.useMock) {
      return this.http.get<DashboardStats>(`${this.apiUrl}/stats`);
    }
    return of({ ...this.mockStats }).pipe(delay(200));
  }
}
