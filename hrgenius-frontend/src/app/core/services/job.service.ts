import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Job } from '../models/job.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/jobs`;

  // Mock job openings across corporate departments
  private jobs: Job[] = [
    {
      job_id: 1,
      job_title: 'Senior Frontend Engineer (Angular)',
      department_id: 1, // Engineering & Technology
      description: 'Lead frontend architecture, build scalable enterprise SPAs with Angular, TypeScript, and modern state management.',
      requirements: '5+ years Angular, RxJS, Material Design, State Management (Signals/NgRx), Web Performance.',
      openings: 2,
      posting_date: '2026-09-01',
      closing_date: '2026-10-31'
    },
    {
      job_id: 2,
      job_title: 'Lead Cloud & DevOps Architect',
      department_id: 1, // Engineering & Technology
      description: 'Design multi-region cloud infrastructure, automate CI/CD pipelines, and enforce zero-trust security postures.',
      requirements: 'Docker, Kubernetes, Terraform, GCP/AWS, GitHub Actions, Linux administration.',
      openings: 1,
      posting_date: '2026-09-10',
      closing_date: '2026-11-15'
    },
    {
      job_id: 3,
      job_title: 'Talent Acquisition Specialist',
      department_id: 2, // Human Resources
      description: 'Manage full-cycle technical recruiting, partner with hiring managers, and drive campus & diversity pipelines.',
      requirements: '3+ years tech recruiting, ATS proficiency, employer branding, behavioral interviewing.',
      openings: 1,
      posting_date: '2026-09-15',
      closing_date: '2026-10-25'
    },
    {
      job_id: 4,
      job_title: 'Senior Financial Analyst',
      department_id: 3, // Finance & Accounting
      description: 'Analyze quarterly corporate performance, financial forecasting, variance reports, and capital expenditure planning.',
      requirements: 'CPA/CFA preferred, financial modeling, SQL/ERP integration, advanced Excel/Tableau.',
      openings: 1,
      posting_date: '2026-08-20',
      closing_date: '2026-10-15'
    },
    {
      job_id: 5,
      job_title: 'Product Marketing Manager',
      department_id: 4, // Marketing & Brand
      description: 'Develop go-to-market strategies for B2B HR tech solutions, lead product launches, and create customer collateral.',
      requirements: '4+ years B2B SaaS marketing, product positioning, content creation, sales enablement.',
      openings: 2,
      posting_date: '2026-09-05',
      closing_date: '2026-11-01'
    },
    {
      job_id: 6,
      job_title: 'Senior UX/UI Researcher & Designer',
      department_id: 5, // Product & Design
      description: 'Conduct qualitative and quantitative user research, create high-fidelity design systems and interactive prototypes.',
      requirements: 'Figma master, design systems, usability testing, heuristic evaluations, user journeys.',
      openings: 1,
      posting_date: '2026-09-12',
      closing_date: '2026-10-30'
    },
    {
      job_id: 7,
      job_title: 'Enterprise Account Executive',
      department_id: 6, // Sales & Partnerships
      description: 'Drive new enterprise revenue, conduct executive demos, and close multi-year HR software contracts.',
      requirements: '5+ years quota-carrying SaaS sales, MEDDIC methodology, CRM excellence, executive presentations.',
      openings: 3,
      posting_date: '2026-09-18',
      closing_date: '2026-11-20'
    }
  ];

  /**
   * Retrieve all jobs
   */
  public getAll(): Observable<Job[]> {
    if (!environment.useMock) {
      return this.http.get<Job[]>(this.apiUrl);
    }
    return of([...this.jobs]).pipe(delay(250));
  }

  /**
   * Retrieve job by ID
   */
  public getById(id: string | number): Observable<Job | undefined> {
    if (!environment.useMock) {
      return this.http.get<Job>(`${this.apiUrl}/${id}`);
    }
    const job = this.jobs.find(j => String(j.job_id) === String(id));
    return of(job ? { ...job } : undefined).pipe(delay(200));
  }

  /**
   * Create a new job
   */
  public create(job: Omit<Job, 'job_id'>): Observable<Job> {
    if (!environment.useMock) {
      return this.http.post<Job>(this.apiUrl, job);
    }
    const nextId = this.jobs.length > 0
      ? Math.max(...this.jobs.map(j => Number(j.job_id) || 0)) + 1
      : 1;

    const newJob: Job = {
      ...job,
      job_id: nextId
    };

    this.jobs = [newJob, ...this.jobs];
    return of({ ...newJob }).pipe(delay(300));
  }

  /**
   * Update an existing job
   */
  public update(id: string | number, changes: Partial<Job>): Observable<Job> {
    if (!environment.useMock) {
      return this.http.put<Job>(`${this.apiUrl}/${id}`, changes);
    }
    const index = this.jobs.findIndex(j => String(j.job_id) === String(id));
    if (index === -1) {
      throw new Error(`Job with ID ${id} not found.`);
    }

    const updatedJob: Job = {
      ...this.jobs[index],
      ...changes,
      job_id: this.jobs[index].job_id
    };

    this.jobs[index] = updatedJob;
    this.jobs = [...this.jobs];
    return of({ ...updatedJob }).pipe(delay(300));
  }

  /**
   * Delete a job by ID
   */
  public delete(id: string | number): Observable<boolean> {
    if (!environment.useMock) {
      return this.http.delete<boolean>(`${this.apiUrl}/${id}`);
    }
    const index = this.jobs.findIndex(j => String(j.job_id) === String(id));
    if (index !== -1) {
      this.jobs.splice(index, 1);
      this.jobs = [...this.jobs];
      return of(true).pipe(delay(300));
    }
    return of(false).pipe(delay(200));
  }
}
