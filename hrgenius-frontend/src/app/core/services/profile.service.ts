import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { UserProfile } from '../models/profile.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/profile`;

  private readonly mockProfile: UserProfile = {
    user_id: 1,
    username: 'admin',
    role: 'ADMIN',
    employee_id: 1,
    employee_code: 'EMP-001',
    first_name: 'Arun',
    last_name: 'Kumar',
    full_name: 'Arun Kumar',
    date_of_birth: '1985-04-12',
    gender: 'Male',
    email: 'admin@hrgenius.com',
    phone: '+91 98765 43210',
    address: '742 Brigade Road, Bengaluru, Karnataka',
    date_of_joining: '2020-01-15',
    department_id: 1,
    department_name: 'Engineering & Technology',
    manager_id: null,
    manager_name: null,
    designation: 'VP of Technology',
    employment_type: 'Full-Time',
    status: 'Active',
    salary_history: []
  };

  /**
   * Retrieve current user profile with employment details and salary history
   */
  public getMyProfile(): Observable<UserProfile> {
    if (!environment.useMock) {
      return this.http.get<UserProfile>(`${this.apiUrl}/me`);
    }
    return of({ ...this.mockProfile }).pipe(delay(200));
  }

  /**
   * Retrieve employee profile by ID
   */
  public getProfileById(employeeId: string | number): Observable<UserProfile> {
    if (!environment.useMock) {
      return this.http.get<UserProfile>(`${this.apiUrl}/${employeeId}`);
    }
    return of({
      ...this.mockProfile,
      employee_id: Number(employeeId)
    }).pipe(delay(200));
  }
}
