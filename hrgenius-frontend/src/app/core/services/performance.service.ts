import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Performance } from '../models/performance.model';
import { EmployeeService } from './employee.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/performance`;
  private readonly employeeService = inject(EmployeeService);

  // In-memory mock performance evaluations dataset
  private performances: Performance[] = [
    {
      performance_id: 1,
      employee_id: 6, // Liam Walker (Manager: 4 Marcus)
      review_period: 'Q3 2026',
      goal: 'Deliver high-performance Angular data table component with virtual scrolling and server pagination',
      achievement: 'Successfully delivered modern data table with full filter integration and sub-50ms render latency.',
      rating: 5,
      feedback: 'Outstanding technical execution and clean architectural separation. Consistently exceeds sprint expectations.',
      reviewed_by: 4, // Marcus Vance
      review_date: '2026-09-25',
      performance_status: 'Completed'
    },
    {
      performance_id: 2,
      employee_id: 7, // Sophia Chen (Manager: 4 Marcus)
      review_period: 'Q3 2026',
      goal: 'Refactor state management in recruitment pipeline to Angular Signals and reactive forms',
      achievement: 'Completed recruitment and candidate status workflow migration with zero regression bugs.',
      rating: 4,
      feedback: 'Excellent attention to UI detail and code readability. Demonstrating solid growth in full-stack features.',
      reviewed_by: 4, // Marcus Vance
      review_date: '2026-09-26',
      performance_status: 'Completed'
    },
    {
      performance_id: 3,
      employee_id: 4, // Marcus Vance (Manager: 1 Alex)
      review_period: 'Q3 2026',
      goal: 'Scale engineering sprint velocity by 20% while sustaining zero P1 production outages',
      achievement: 'Maintained 99.98% service uptime and shortened release validation cycle by 2.5 days.',
      rating: 5,
      feedback: 'Superb leadership and engineering team alignment. Fosters high psychological safety and delivery rigour.',
      reviewed_by: 1, // Alex Mercer
      review_date: '2026-09-27',
      performance_status: 'Completed'
    },
    {
      performance_id: 4,
      employee_id: 2, // Sarah Jenkins (HR Lead)
      review_period: 'Q3 2026',
      goal: 'Automate candidate background verification and streamline onboarding turnaround to under 5 days',
      achievement: 'Implemented instant credential verification handoff and onboarded 8 top-tier engineering leads.',
      rating: 5,
      feedback: 'Transformative contribution to company talent acquisition and compliance integrity.',
      reviewed_by: 1, // Alex Mercer
      review_date: '2026-09-28',
      performance_status: 'Completed'
    },
    {
      performance_id: 5,
      employee_id: 5, // Elena Rostova (Product Design)
      review_period: 'Q3 2026',
      goal: 'Establish unified design system token library and accessibility AA compliance for dashboard',
      achievement: 'Published complete design tokens and resolved 100% of color-contrast and tap-target warnings.',
      rating: 5,
      feedback: 'World-class visual aesthetics and relentless dedication to accessible user experience.',
      reviewed_by: 1, // Alex Mercer
      review_date: '2026-09-29',
      performance_status: 'Completed'
    },
    {
      performance_id: 6,
      employee_id: 8, // Daniel Miller
      review_period: 'Q3 2026',
      goal: 'Optimize PostgreSQL query indexes and automate database disaster recovery rehearsal',
      achievement: 'Reduced 95th percentile query latency from 320ms to 45ms across payroll datasets.',
      rating: 4,
      feedback: 'Strong technical domain mastery and proactive maintenance of production reliability.',
      reviewed_by: 4,
      review_date: '2026-09-20',
      performance_status: 'Completed'
    },
    {
      performance_id: 7,
      employee_id: 9, // Olivia Davis
      review_period: 'Q3 2026',
      goal: 'Migrate legacy build tooling to modern Vite/esbuild bundler configuration',
      achievement: 'Halved local development cold-start time and improved production bundle efficiency.',
      rating: 4,
      feedback: 'Solid initiative and execution. Continue taking on more cross-functional collaboration.',
      reviewed_by: 4,
      review_date: '2026-09-22',
      performance_status: 'Completed'
    },
    {
      performance_id: 8,
      employee_id: 6, // Liam Walker (Q4 Goal)
      review_period: 'Q4 2026',
      goal: 'Implement real-time WebSocket attendance notifications and biometric clock sync integration',
      achievement: 'Preliminary architecture RFC drafted and peer-reviewed.',
      rating: 0,
      feedback: 'Goal actively in progress for current operational quarter.',
      reviewed_by: 4,
      review_date: '2026-10-01',
      performance_status: 'In Progress'
    },
    {
      performance_id: 9,
      employee_id: 7, // Sophia Chen (Q4 Goal)
      review_period: 'Q4 2026',
      goal: 'Build interactive chart analytics suite using Chart.js with dynamic role-based filtering',
      achievement: 'Component scaffolding established with data bindings.',
      rating: 0,
      feedback: 'Under active development.',
      reviewed_by: 4,
      review_date: '2026-10-01',
      performance_status: 'In Progress'
    }
  ];

  /**
   * Retrieve all performance records
   */
  public getAll(): Observable<Performance[]> {
    if (!environment.useMock) {
      return this.http.get<Performance[]>(this.apiUrl);
    }
    return of([...this.performances]).pipe(delay(250));
  }

  /**
   * Retrieve performance records for an employee
   */
  public getByEmployee(employeeId: string | number): Observable<Performance[]> {
    if (!environment.useMock) {
      return this.http.get<Performance[]>(`${this.apiUrl}/employee/${employeeId}`);
    }
    const list = this.performances.filter(p => String(p.employee_id) === String(employeeId));
    return of([...list]).pipe(delay(200));
  }

  /**
   * Retrieve performance records for direct reports of a manager
   */
  public getByManager(managerId: string | number): Observable<Performance[]> {
    if (!environment.useMock) {
      return this.http.get<Performance[]>(`${this.apiUrl}/manager/${managerId}`);
    }
    return this.employeeService.getAll().pipe(
      map(allEmployees => {
        const reportIds = new Set(
          allEmployees
            .filter(e => e.manager_id && String(e.manager_id) === String(managerId))
            .map(e => String(e.employee_id))
        );
        return this.performances.filter(p => reportIds.has(String(p.employee_id)));
      }),
      delay(200)
    );
  }

  /**
   * Retrieve review by ID
   */
  public getById(id: string | number): Observable<Performance | undefined> {
    if (!environment.useMock) {
      return this.http.get<Performance>(`${this.apiUrl}/${id}`);
    }
    const item = this.performances.find(p => String(p.performance_id) === String(id));
    return of(item ? { ...item } : undefined).pipe(delay(150));
  }

  /**
   * Set a new goal for an employee (Manager)
   */
  public create(performance: Omit<Performance, 'performance_id'>): Observable<Performance> {
    if (!environment.useMock) {
      return this.http.post<Performance>(this.apiUrl, performance);
    }
    const nextId = this.performances.length > 0
      ? Math.max(...this.performances.map(p => Number(p.performance_id) || 0)) + 1
      : 1;

    const newRecord: Performance = {
      ...performance,
      performance_id: nextId
    };

    this.performances = [newRecord, ...this.performances];
    return of({ ...newRecord }).pipe(delay(300));
  }

  /**
   * Submit performance review (rating 1-5, feedback, achievement)
   */
  public submitReview(
    performanceId: string | number,
    rating: number,
    feedback: string,
    achievement?: string,
    reviewedBy?: string | number
  ): Observable<Performance> {
    if (!environment.useMock) {
      return this.http.put<Performance>(`${this.apiUrl}/${performanceId}/review`, {
        rating,
        feedback,
        achievement,
        reviewed_by: reviewedBy
      });
    }

    const index = this.performances.findIndex(p => String(p.performance_id) === String(performanceId));
    if (index === -1) {
      throw new Error(`Performance record #${performanceId} not found.`);
    }

    const today = new Date().toISOString().split('T')[0];
    const updated: Performance = {
      ...this.performances[index],
      rating,
      feedback,
      achievement: achievement !== undefined ? achievement : this.performances[index].achievement,
      reviewed_by: reviewedBy !== undefined ? reviewedBy : this.performances[index].reviewed_by,
      review_date: today,
      performance_status: 'Completed'
    };

    this.performances[index] = updated;
    this.performances = [...this.performances];
    return of({ ...updated }).pipe(delay(250));
  }

  /**
   * Update performance record
   */
  public update(id: string | number, changes: Partial<Performance>): Observable<Performance> {
    if (!environment.useMock) {
      return this.http.put<Performance>(`${this.apiUrl}/${id}`, changes);
    }
    const index = this.performances.findIndex(p => String(p.performance_id) === String(id));
    if (index === -1) {
      throw new Error(`Performance record #${id} not found.`);
    }

    const updated: Performance = {
      ...this.performances[index],
      ...changes,
      performance_id: this.performances[index].performance_id
    };

    this.performances[index] = updated;
    this.performances = [...this.performances];
    return of({ ...updated }).pipe(delay(250));
  }

  /**
   * Delete performance record
   */
  public delete(id: string | number): Observable<boolean> {
    if (!environment.useMock) {
      return this.http.delete<boolean>(`${this.apiUrl}/${id}`);
    }
    const index = this.performances.findIndex(p => String(p.performance_id) === String(id));
    if (index !== -1) {
      this.performances.splice(index, 1);
      this.performances = [...this.performances];
      return of(true).pipe(delay(250));
    }
    return of(false).pipe(delay(150));
  }
}
