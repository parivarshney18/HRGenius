import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Leave } from '../models/leave.model';
import { EmployeeService } from './employee.service';
import { environment } from '../../../environments/environment';

export function calculateLeaveDays(startDate: string, endDate: string): number {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return 0;
    }
    // Calculate inclusive days (excluding weekends for standard business leave)
    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const dayOfWeek = cur.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return count > 0 ? count : 1;
  } catch {
    return 1;
  }
}

@Injectable({
  providedIn: 'root'
})
export class LeaveService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/leaves`;
  private readonly employeeService = inject(EmployeeService);

  // In-memory mock leave requests dataset
  private leaves: Leave[] = [
    {
      leave_id: 1,
      employee_id: 6, // Liam Walker (Manager: 4 Marcus)
      leave_type: 'Annual Leave',
      start_date: '2026-10-05',
      end_date: '2026-10-09',
      number_of_days: 5,
      reason: 'Family autumn vacation trip to Colorado',
      applied_date: '2026-09-28',
      approved_by: null,
      approval_date: null,
      leave_status: 'PENDING'
    },
    {
      leave_id: 2,
      employee_id: 7, // Sophia Chen (Manager: 4 Marcus)
      leave_type: 'Sick Leave',
      start_date: '2026-10-01',
      end_date: '2026-10-02',
      number_of_days: 2,
      reason: 'Wisdom tooth extraction surgery and recovery',
      applied_date: '2026-09-29',
      approved_by: null,
      approval_date: null,
      leave_status: 'PENDING'
    },
    {
      leave_id: 3,
      employee_id: 5, // Elena Rostova
      leave_type: 'Casual Leave',
      start_date: '2026-10-12',
      end_date: '2026-10-13',
      number_of_days: 2,
      reason: 'Personal relocation and home closing',
      applied_date: '2026-09-27',
      approved_by: null,
      approval_date: null,
      leave_status: 'PENDING'
    },
    {
      leave_id: 4,
      employee_id: 4, // Marcus Vance
      leave_type: 'Annual Leave',
      start_date: '2026-10-19',
      end_date: '2026-10-23',
      number_of_days: 5,
      reason: 'Annual family break',
      applied_date: '2026-09-25',
      approved_by: 1, // Alex Mercer
      approval_date: '2026-09-26',
      leave_status: 'APPROVED'
    },
    {
      leave_id: 5,
      employee_id: 8, // Daniel Miller
      leave_type: 'Sick Leave',
      start_date: '2026-09-29',
      end_date: '2026-09-30',
      number_of_days: 2,
      reason: 'Severe viral fever and medical observation',
      applied_date: '2026-09-29',
      approved_by: 2, // Sarah Jenkins
      approval_date: '2026-09-29',
      leave_status: 'APPROVED'
    },
    {
      leave_id: 6,
      employee_id: 9, // Olivia Davis
      leave_type: 'Casual Leave',
      start_date: '2026-09-18',
      end_date: '2026-09-18',
      number_of_days: 1,
      reason: 'DMV vehicle renewal appointment',
      applied_date: '2026-09-14',
      approved_by: 3,
      approval_date: '2026-09-15',
      leave_status: 'APPROVED'
    },
    {
      leave_id: 7,
      employee_id: 10, // Ethan Taylor
      leave_type: 'Annual Leave',
      start_date: '2026-09-21',
      end_date: '2026-09-25',
      number_of_days: 5,
      reason: 'Travel out of state',
      applied_date: '2026-09-10',
      approved_by: 3,
      approval_date: '2026-09-11',
      leave_status: 'APPROVED'
    },
    {
      leave_id: 8,
      employee_id: 6, // Liam Walker
      leave_type: 'Casual Leave',
      start_date: '2026-09-15',
      end_date: '2026-09-16',
      number_of_days: 2,
      reason: 'Project crunch clash request',
      applied_date: '2026-09-12',
      approved_by: 4,
      approval_date: '2026-09-13',
      leave_status: 'REJECTED'
    },
    {
      leave_id: 9,
      employee_id: 12, // Chloe Bennett
      leave_type: 'Maternity Leave',
      start_date: '2026-11-01',
      end_date: '2027-01-31',
      number_of_days: 65,
      reason: 'Maternity leave period',
      applied_date: '2026-09-20',
      approved_by: 2,
      approval_date: '2026-09-22',
      leave_status: 'APPROVED'
    },
    {
      leave_id: 10,
      employee_id: 13, // Lucas Gray
      leave_type: 'Unpaid Leave',
      start_date: '2026-10-26',
      end_date: '2026-10-30',
      number_of_days: 5,
      reason: 'Personal master thesis defense preparation',
      applied_date: '2026-09-28',
      approved_by: null,
      approval_date: null,
      leave_status: 'PENDING'
    }
  ];

  /**
   * Check for overlapping leave requests for an employee
   */
  public hasOverlap(
    employeeId: string | number,
    startDate: string,
    endDate: string,
    excludeLeaveId?: string | number
  ): boolean {
    const newStart = new Date(startDate).getTime();
    const newEnd = new Date(endDate).getTime();

    return this.leaves.some(l => {
      if (String(l.employee_id) !== String(employeeId)) return false;
      if (l.leave_status === 'REJECTED') return false; // Rejected leaves do not conflict
      if (excludeLeaveId && String(l.leave_id) === String(excludeLeaveId)) return false;

      const existingStart = new Date(l.start_date).getTime();
      const existingEnd = new Date(l.end_date).getTime();

      // Overlap condition: (StartA <= EndB) and (EndA >= StartB)
      return newStart <= existingEnd && newEnd >= existingStart;
    });
  }

  /**
   * Retrieve all leaves
   */
  public getAll(): Observable<Leave[]> {
    if (!environment.useMock) {
      return this.http.get<Leave[]>(this.apiUrl);
    }
    return of([...this.leaves]).pipe(delay(250));
  }

  /**
   * Retrieve current authenticated employee leave requests
   */
  public getMyLeaves(): Observable<Leave[]> {
    if (!environment.useMock) {
      return this.http.get<Leave[]>(`${this.apiUrl}/my`);
    }
    const empId = localStorage.getItem('employee_id');
    const list = empId ? this.leaves.filter(l => String(l.employee_id) === String(empId)) : this.leaves;
    return of([...list]).pipe(delay(200));
  }


  /**
   * Retrieve leaves by employee ID
   */
  public getByEmployee(employeeId: string | number): Observable<Leave[]> {
    if (!environment.useMock) {
      return this.http.get<Leave[]>(`${this.apiUrl}/employee/${employeeId}`);
    }
    const list = this.leaves.filter(l => String(l.employee_id) === String(employeeId));
    return of([...list]).pipe(delay(200));
  }

  /**
   * Retrieve pending leave requests
   */
  public getPending(): Observable<Leave[]> {
    if (!environment.useMock) {
      return this.http.get<Leave[]>(`${this.apiUrl}/pending`);
    }
    const pending = this.leaves.filter(l => l.leave_status === 'PENDING');
    return of([...pending]).pipe(delay(200));
  }

  /**
   * Retrieve leaves for direct reports of a manager
   */
  public getByManager(managerId: string | number): Observable<Leave[]> {
    if (!environment.useMock) {
      return this.http.get<Leave[]>(`${this.apiUrl}/manager/${managerId}`);
    }
    return this.employeeService.getAll().pipe(
      map(allEmployees => {
        const reportIds = new Set(
          allEmployees
            .filter(e => e.manager_id && String(e.manager_id) === String(managerId))
            .map(e => String(e.employee_id))
        );
        return this.leaves.filter(l => reportIds.has(String(l.employee_id)));
      }),
      delay(200)
    );
  }

  /**
   * Apply for leave (with automatic overlap check)
   */
  public apply(leave: Omit<Leave, 'leave_id' | 'applied_date' | 'approved_by' | 'approval_date' | 'leave_status'>): Observable<Leave> {
    if (!environment.useMock) {
      return this.http.post<Leave>(this.apiUrl, leave);
    }

    // Validate overlap
    if (this.hasOverlap(leave.employee_id, leave.start_date, leave.end_date)) {
      throw new Error(`You already have an active or pending leave request overlapping with ${leave.start_date} to ${leave.end_date}.`);
    }

    const nextId = this.leaves.length > 0
      ? Math.max(...this.leaves.map(l => Number(l.leave_id) || 0)) + 1
      : 1;

    const days = leave.number_of_days > 0 ? leave.number_of_days : calculateLeaveDays(leave.start_date, leave.end_date);
    const today = new Date().toISOString().split('T')[0];

    const newLeave: Leave = {
      ...leave,
      leave_id: nextId,
      number_of_days: days,
      applied_date: today,
      approved_by: null,
      approval_date: null,
      leave_status: 'PENDING'
    };

    this.leaves = [newLeave, ...this.leaves];
    return of({ ...newLeave }).pipe(delay(300));
  }

  /**
   * Approve leave
   */
  public approve(leaveId: string | number, approverId: string | number): Observable<Leave> {
    if (!environment.useMock) {
      return this.http.put<Leave>(`${this.apiUrl}/${leaveId}/approve`, { approved_by: approverId });
    }

    const index = this.leaves.findIndex(l => String(l.leave_id) === String(leaveId));
    if (index === -1) {
      throw new Error(`Leave request #${leaveId} not found.`);
    }

    const today = new Date().toISOString().split('T')[0];
    const updated: Leave = {
      ...this.leaves[index],
      leave_status: 'APPROVED',
      approved_by: approverId,
      approval_date: today
    };

    this.leaves[index] = updated;
    this.leaves = [...this.leaves];
    return of({ ...updated }).pipe(delay(250));
  }

  /**
   * Reject leave
   */
  public reject(leaveId: string | number, approverId: string | number): Observable<Leave> {
    if (!environment.useMock) {
      return this.http.put<Leave>(`${this.apiUrl}/${leaveId}/reject`, { approved_by: approverId });
    }

    const index = this.leaves.findIndex(l => String(l.leave_id) === String(leaveId));
    if (index === -1) {
      throw new Error(`Leave request #${leaveId} not found.`);
    }

    const today = new Date().toISOString().split('T')[0];
    const updated: Leave = {
      ...this.leaves[index],
      leave_status: 'REJECTED',
      approved_by: approverId,
      approval_date: today
    };

    this.leaves[index] = updated;
    this.leaves = [...this.leaves];
    return of({ ...updated }).pipe(delay(250));
  }

  /**
   * Delete leave
   */
  public delete(leaveId: string | number): Observable<boolean> {
    if (!environment.useMock) {
      return this.http.delete<boolean>(`${this.apiUrl}/${leaveId}`);
    }

    const index = this.leaves.findIndex(l => String(l.leave_id) === String(leaveId));
    if (index !== -1) {
      this.leaves.splice(index, 1);
      this.leaves = [...this.leaves];
      return of(true).pipe(delay(250));
    }
    return of(false).pipe(delay(200));
  }
}
