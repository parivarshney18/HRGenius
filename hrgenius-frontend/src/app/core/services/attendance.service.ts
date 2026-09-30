import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Attendance } from '../models/attendance.model';
import { EmployeeService } from './employee.service';
import { environment } from '../../../environments/environment';

export function calculateWorkingHours(checkIn: string, checkOut: string): number {
  try {
    const [inH, inM] = checkIn.split(':').map(Number);
    const [outH, outM] = checkOut.split(':').map(Number);
    const diffMinutes = (outH * 60 + outM) - (inH * 60 + inM);
    if (diffMinutes <= 0) return 0;
    return Math.round((diffMinutes / 60) * 10) / 10;
  } catch {
    return 0;
  }
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/attendance`;
  private readonly employeeService = inject(EmployeeService);

  // In-memory mock attendance dataset
  private attendances: Attendance[] = [
    // Today's records (2026-09-30)
    {
      attendance_id: 1,
      employee_id: 1, // Alex Mercer
      attendance_date: '2026-09-30',
      check_in: '08:45',
      check_out: null,
      attendance_status: 'Present',
      working_hours: null,
      remarks: 'On-site executive shift'
    },
    {
      attendance_id: 2,
      employee_id: 2, // Sarah Jenkins
      attendance_date: '2026-09-30',
      check_in: '09:00',
      check_out: null,
      attendance_status: 'Present',
      working_hours: null,
      remarks: 'HR morning reviews'
    },
    {
      attendance_id: 3,
      employee_id: 4, // Marcus Vance
      attendance_date: '2026-09-30',
      check_in: '09:40',
      check_out: null,
      attendance_status: 'Late',
      working_hours: null,
      remarks: 'Traffic delay on highway'
    },
    {
      attendance_id: 4,
      employee_id: 6, // Liam Walker (Manager: Marcus)
      attendance_date: '2026-09-30',
      check_in: '09:05',
      check_out: null,
      attendance_status: 'Present',
      working_hours: null,
      remarks: 'Sprint planning day'
    },
    {
      attendance_id: 5,
      employee_id: 7, // Sophia Chen (Manager: Marcus)
      attendance_date: '2026-09-30',
      check_in: '08:55',
      check_out: null,
      attendance_status: 'Present',
      working_hours: null,
      remarks: 'Angular component refactor'
    },
    {
      attendance_id: 6,
      employee_id: 8, // Daniel Miller
      attendance_date: '2026-09-30',
      check_in: null,
      check_out: null,
      attendance_status: 'Absent',
      working_hours: 0,
      remarks: 'Sick leave reported'
    },
    {
      attendance_id: 7,
      employee_id: 9, // Olivia Davis
      attendance_date: '2026-09-30',
      check_in: '09:10',
      check_out: '13:40',
      attendance_status: 'Half-day',
      working_hours: 4.5,
      remarks: 'Approved afternoon personal leave'
    },
    {
      attendance_id: 8,
      employee_id: 10, // Ethan Taylor
      attendance_date: '2026-09-30',
      check_in: '08:30',
      check_out: '17:00',
      attendance_status: 'Present',
      working_hours: 8.5,
      remarks: 'Financial audit preparation'
    },

    // Yesterday's records (2026-09-29)
    {
      attendance_id: 9,
      employee_id: 1,
      attendance_date: '2026-09-29',
      check_in: '08:50',
      check_out: '17:30',
      attendance_status: 'Present',
      working_hours: 8.7,
      remarks: 'Full day completed'
    },
    {
      attendance_id: 10,
      employee_id: 2,
      attendance_date: '2026-09-29',
      check_in: '08:55',
      check_out: '17:15',
      attendance_status: 'Present',
      working_hours: 8.3,
      remarks: 'Full day completed'
    },
    {
      attendance_id: 11,
      employee_id: 4,
      attendance_date: '2026-09-29',
      check_in: '09:00',
      check_out: '17:30',
      attendance_status: 'Present',
      working_hours: 8.5,
      remarks: 'Full day completed'
    },
    {
      attendance_id: 12,
      employee_id: 6,
      attendance_date: '2026-09-29',
      check_in: '09:50',
      check_out: '18:20',
      attendance_status: 'Late',
      working_hours: 8.5,
      remarks: 'Late check-in due to transit'
    },
    {
      attendance_id: 13,
      employee_id: 7,
      attendance_date: '2026-09-29',
      check_in: '08:50',
      check_out: '17:20',
      attendance_status: 'Present',
      working_hours: 8.5,
      remarks: 'Full day completed'
    },
    {
      attendance_id: 14,
      employee_id: 12,
      attendance_date: '2026-09-29',
      check_in: '09:15',
      check_out: '13:45',
      attendance_status: 'Half-day',
      working_hours: 4.5,
      remarks: 'Doctor appointment'
    },

    // 2026-09-28 records
    {
      attendance_id: 15,
      employee_id: 4,
      attendance_date: '2026-09-28',
      check_in: '09:00',
      check_out: '17:00',
      attendance_status: 'Present',
      working_hours: 8.0,
      remarks: 'Full day completed'
    },
    {
      attendance_id: 16,
      employee_id: 6,
      attendance_date: '2026-09-28',
      check_in: '08:45',
      check_out: '17:15',
      attendance_status: 'Present',
      working_hours: 8.5,
      remarks: 'Full day completed'
    },
    {
      attendance_id: 17,
      employee_id: 7,
      attendance_date: '2026-09-28',
      check_in: '08:55',
      check_out: '17:30',
      attendance_status: 'Present',
      working_hours: 8.6,
      remarks: 'Full day completed'
    }
  ];

  /**
   * Retrieve all attendance records
   */
  public getAll(): Observable<Attendance[]> {
    if (!environment.useMock) {
      return this.http.get<Attendance[]>(this.apiUrl);
    }
    return of([...this.attendances]).pipe(delay(200));
  }

  /**
   * Retrieve attendance records for a specific employee
   */
  public getByEmployee(employeeId: string | number): Observable<Attendance[]> {
    if (!environment.useMock) {
      return this.http.get<Attendance[]>(`${this.apiUrl}/employee/${employeeId}`);
    }
    const list = this.attendances.filter(a => String(a.employee_id) === String(employeeId));
    return of([...list]).pipe(delay(200));
  }

  /**
   * Retrieve attendance records for all direct reports of a manager
   */
  public getByManager(managerId: string | number): Observable<Attendance[]> {
    if (!environment.useMock) {
      return this.http.get<Attendance[]>(`${this.apiUrl}/manager/${managerId}`);
    }
    return this.employeeService.getAll().pipe(
      map(allEmployees => {
        const reportIds = new Set(
          allEmployees
            .filter(e => e.manager_id && String(e.manager_id) === String(managerId))
            .map(e => String(e.employee_id))
        );
        return this.attendances.filter(a => reportIds.has(String(a.employee_id)));
      }),
      delay(200)
    );
  }

  /**
   * Get today's attendance record for an employee
   */
  public getTodayRecord(employeeId: string | number): Observable<Attendance | undefined> {
    if (!environment.useMock) {
      return this.http.get<Attendance>(`${this.apiUrl}/today/${employeeId}`);
    }
    const today = new Date().toISOString().split('T')[0];
    const record = this.attendances.find(
      a => String(a.employee_id) === String(employeeId) && a.attendance_date === today
    );
    return of(record ? { ...record } : undefined).pipe(delay(150));
  }

  /**
   * Check in for today
   */
  public checkIn(employeeId: string | number, remarks: string = 'Standard Punch-In'): Observable<Attendance> {
    if (!environment.useMock) {
      return this.http.post<Attendance>(`${this.apiUrl}/check-in`, { employee_id: employeeId, remarks });
    }
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Determine status: Late if after 09:30 AM
    const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30);
    const status = isLate ? 'Late' : 'Present';

    const existingIndex = this.attendances.findIndex(
      a => String(a.employee_id) === String(employeeId) && a.attendance_date === today
    );

    if (existingIndex !== -1) {
      const updated: Attendance = {
        ...this.attendances[existingIndex],
        check_in: timeStr,
        attendance_status: status,
        remarks: remarks || this.attendances[existingIndex].remarks
      };
      this.attendances[existingIndex] = updated;
      this.attendances = [...this.attendances];
      return of({ ...updated }).pipe(delay(250));
    }

    const nextId = this.attendances.length > 0
      ? Math.max(...this.attendances.map(a => Number(a.attendance_id) || 0)) + 1
      : 1;

    const newRecord: Attendance = {
      attendance_id: nextId,
      employee_id: employeeId,
      attendance_date: today,
      check_in: timeStr,
      check_out: null,
      attendance_status: status,
      working_hours: null,
      remarks: remarks
    };

    this.attendances = [newRecord, ...this.attendances];
    return of({ ...newRecord }).pipe(delay(250));
  }

  /**
   * Check out for today
   */
  public checkOut(employeeId: string | number, remarks?: string): Observable<Attendance> {
    if (!environment.useMock) {
      return this.http.post<Attendance>(`${this.apiUrl}/check-out`, { employee_id: employeeId, remarks });
    }
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const existingIndex = this.attendances.findIndex(
      a => String(a.employee_id) === String(employeeId) && a.attendance_date === today
    );

    if (existingIndex === -1) {
      throw new Error('No check-in record found for today. Please check in first.');
    }

    const current = this.attendances[existingIndex];
    const checkInTime = current.check_in || '09:00';
    const hours = calculateWorkingHours(checkInTime, timeStr);

    let status = current.attendance_status;
    if (hours > 0 && hours < 5) {
      status = 'Half-day';
    }

    const updated: Attendance = {
      ...current,
      check_out: timeStr,
      working_hours: hours,
      attendance_status: status,
      remarks: remarks || current.remarks || 'Daily shift completed'
    };

    this.attendances[existingIndex] = updated;
    this.attendances = [...this.attendances];
    return of({ ...updated }).pipe(delay(250));
  }

  /**
   * Create or manually log an attendance record
   */
  public create(attendance: Omit<Attendance, 'attendance_id'>): Observable<Attendance> {
    if (!environment.useMock) {
      return this.http.post<Attendance>(this.apiUrl, attendance);
    }
    const nextId = this.attendances.length > 0
      ? Math.max(...this.attendances.map(a => Number(a.attendance_id) || 0)) + 1
      : 1;

    let hours = attendance.working_hours;
    if (attendance.check_in && attendance.check_out && (hours === null || hours === undefined)) {
      hours = calculateWorkingHours(attendance.check_in, attendance.check_out);
    }

    const newRecord: Attendance = {
      ...attendance,
      attendance_id: nextId,
      working_hours: hours
    };

    this.attendances = [newRecord, ...this.attendances];
    return of({ ...newRecord }).pipe(delay(250));
  }

  /**
   * Update attendance record
   */
  public update(id: string | number, patch: Partial<Attendance>): Observable<Attendance> {
    if (!environment.useMock) {
      return this.http.put<Attendance>(`${this.apiUrl}/${id}`, patch);
    }
    const index = this.attendances.findIndex(a => String(a.attendance_id) === String(id));
    if (index === -1) {
      throw new Error(`Attendance record #${id} not found.`);
    }

    const current = this.attendances[index];
    let hours = patch.working_hours !== undefined ? patch.working_hours : current.working_hours;
    const checkIn = patch.check_in !== undefined ? patch.check_in : current.check_in;
    const checkOut = patch.check_out !== undefined ? patch.check_out : current.check_out;

    if (checkIn && checkOut && (hours === null || hours === undefined)) {
      hours = calculateWorkingHours(checkIn, checkOut);
    }

    const updated: Attendance = {
      ...current,
      ...patch,
      working_hours: hours
    };

    this.attendances[index] = updated;
    this.attendances = [...this.attendances];
    return of({ ...updated }).pipe(delay(250));
  }

  /**
   * Delete attendance record
   */
  public delete(id: string | number): Observable<boolean> {
    if (!environment.useMock) {
      return this.http.delete<boolean>(`${this.apiUrl}/${id}`);
    }
    const index = this.attendances.findIndex(a => String(a.attendance_id) === String(id));
    if (index !== -1) {
      this.attendances.splice(index, 1);
      this.attendances = [...this.attendances];
      return of(true).pipe(delay(250));
    }
    return of(false).pipe(delay(200));
  }
}
