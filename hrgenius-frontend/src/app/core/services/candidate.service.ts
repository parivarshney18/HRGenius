import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Candidate } from '../models/candidate.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CandidateService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/candidates`;

  // Mock candidates linked to jobs
  private candidates: Candidate[] = [
    // Job 1: Senior Frontend Engineer (Angular)
    {
      candidate_id: 1,
      job_id: 1,
      candidate_name: 'Jordan Lee',
      candidate_email: 'jordan.lee@example.com',
      resume: 'resume_jordan_lee_angular.pdf',
      application_date: '2026-09-05',
      application_status: 'Applied',
      interview_date: null,
      interview_result: null
    },
    {
      candidate_id: 2,
      job_id: 1,
      candidate_name: 'Priya Sharma',
      candidate_email: 'priya.sharma@example.com',
      resume: 'resume_priya_sharma_tech.pdf',
      application_date: '2026-09-08',
      application_status: 'Shortlisted',
      interview_date: '2026-10-05',
      interview_result: 'Technical round scheduled'
    },
    {
      candidate_id: 3,
      job_id: 1,
      candidate_name: 'Carlos Mendoza',
      candidate_email: 'carlos.mendoza@example.com',
      resume: 'resume_carlos_mendoza.pdf',
      application_date: '2026-09-03',
      application_status: 'Interviewed',
      interview_date: '2026-09-22',
      interview_result: 'Passed - Strong Angular Signals & RxJS proficiency'
    },
    {
      candidate_id: 4,
      job_id: 1,
      candidate_name: 'Emily Vance',
      candidate_email: 'emily.vance@example.com',
      resume: 'resume_emily_vance_cv.pdf',
      application_date: '2026-08-28',
      application_status: 'Selected',
      interview_date: '2026-09-15',
      interview_result: 'Selected - Formal offer letter extended'
    },
    {
      candidate_id: 5,
      job_id: 1,
      candidate_name: 'David Kim',
      candidate_email: 'david.kim@example.com',
      resume: 'resume_david_kim.pdf',
      application_date: '2026-09-02',
      application_status: 'Rejected',
      interview_date: '2026-09-12',
      interview_result: 'Rejected - Missing enterprise Angular experience'
    },

    // Job 2: Lead Cloud & DevOps Architect
    {
      candidate_id: 6,
      job_id: 2,
      candidate_name: 'Samantha Fox',
      candidate_email: 'samantha.fox@example.com',
      resume: 'resume_samantha_cloud.pdf',
      application_date: '2026-09-14',
      application_status: 'Shortlisted',
      interview_date: '2026-10-08',
      interview_result: 'Architecture screening pending'
    },
    {
      candidate_id: 7,
      job_id: 2,
      candidate_name: 'Kevin Patel',
      candidate_email: 'kevin.patel@example.com',
      resume: 'resume_kevin_devops.pdf',
      application_date: '2026-09-12',
      application_status: 'Interviewed',
      interview_date: '2026-09-26',
      interview_result: 'Passed - Kubernetes & Terraform hands-on test'
    },

    // Job 3: Talent Acquisition Specialist
    {
      candidate_id: 8,
      job_id: 3,
      candidate_name: 'Rachel Adams',
      candidate_email: 'rachel.adams@example.com',
      resume: 'resume_rachel_adams_hr.pdf',
      application_date: '2026-09-20',
      application_status: 'Applied',
      interview_date: null,
      interview_result: null
    },
    {
      candidate_id: 9,
      job_id: 3,
      candidate_name: 'Brian O\'Connor',
      candidate_email: 'brian.oc@example.com',
      resume: 'resume_brian_oconnor.pdf',
      application_date: '2026-09-18',
      application_status: 'Interviewed',
      interview_date: '2026-09-28',
      interview_result: 'Strong tech recruitment background; awaiting leadership review'
    },

    // Job 4: Senior Financial Analyst
    {
      candidate_id: 10,
      job_id: 4,
      candidate_name: 'Linda Wang',
      candidate_email: 'linda.wang@example.com',
      resume: 'resume_linda_wang_cfa.pdf',
      application_date: '2026-08-25',
      application_status: 'Selected',
      interview_date: '2026-09-10',
      interview_result: 'Offer accepted - Joining in November'
    },

    // Job 5: Product Marketing Manager
    {
      candidate_id: 11,
      job_id: 5,
      candidate_name: 'Marcus Brody',
      candidate_email: 'marcus.brody@example.com',
      resume: 'resume_marcus_brody_mktg.pdf',
      application_date: '2026-09-10',
      application_status: 'Shortlisted',
      interview_date: '2026-10-03',
      interview_result: 'Panel presentation scheduled'
    },
    {
      candidate_id: 12,
      job_id: 5,
      candidate_name: 'Hannah Abbott',
      candidate_email: 'hannah.abbott@example.com',
      resume: 'resume_hannah_abbott.pdf',
      application_date: '2026-09-22',
      application_status: 'Applied',
      interview_date: null,
      interview_result: null
    },

    // Job 6: Senior UX/UI Researcher & Designer
    {
      candidate_id: 13,
      job_id: 6,
      candidate_name: 'Nathan Drake',
      candidate_email: 'nathan.drake@example.com',
      resume: 'resume_nathan_drake_design.pdf',
      application_date: '2026-09-15',
      application_status: 'Interviewed',
      interview_date: '2026-09-25',
      interview_result: 'Exceptional design system case study'
    },

    // Job 7: Enterprise Account Executive
    {
      candidate_id: 14,
      job_id: 7,
      candidate_name: 'Chloe Frazer',
      candidate_email: 'chloe.frazer@example.com',
      resume: 'resume_chloe_frazer_sales.pdf',
      application_date: '2026-09-21',
      application_status: 'Applied',
      interview_date: null,
      interview_result: null
    },
    {
      candidate_id: 15,
      job_id: 7,
      candidate_name: 'Victor Sullivan',
      candidate_email: 'victor.sullivan@example.com',
      resume: 'resume_victor_sullivan.pdf',
      application_date: '2026-09-19',
      application_status: 'Shortlisted',
      interview_date: '2026-10-06',
      interview_result: 'Initial phone screen passed'
    }
  ];

  /**
   * Retrieve all candidates
   */
  public getAll(): Observable<Candidate[]> {
    if (!environment.useMock) {
      return this.http.get<Candidate[]>(this.apiUrl);
    }
    return of([...this.candidates]).pipe(delay(250));
  }

  /**
   * Retrieve candidates for a specific job
   */
  public getByJobId(jobId: string | number): Observable<Candidate[]> {
    if (!environment.useMock) {
      return this.http.get<Candidate[]>(`${this.apiUrl}/job/${jobId}`);
    }
    const list = this.candidates.filter(c => String(c.job_id) === String(jobId));
    return of([...list]).pipe(delay(200));
  }

  /**
   * Retrieve candidate by ID
   */
  public getById(candidateId: string | number): Observable<Candidate | undefined> {
    if (!environment.useMock) {
      return this.http.get<Candidate>(`${this.apiUrl}/${candidateId}`);
    }
    const cand = this.candidates.find(c => String(c.candidate_id) === String(candidateId));
    return of(cand ? { ...cand } : undefined).pipe(delay(200));
  }

  /**
   * Create candidate application
   */
  public create(candidate: Omit<Candidate, 'candidate_id'>): Observable<Candidate> {
    if (!environment.useMock) {
      return this.http.post<Candidate>(this.apiUrl, candidate);
    }
    const nextId = this.candidates.length > 0
      ? Math.max(...this.candidates.map(c => Number(c.candidate_id) || 0)) + 1
      : 1;

    const newCandidate: Candidate = {
      ...candidate,
      candidate_id: nextId
    };

    this.candidates = [newCandidate, ...this.candidates];
    return of({ ...newCandidate }).pipe(delay(300));
  }

  /**
   * Update candidate details
   */
  public update(candidateId: string | number, changes: Partial<Candidate>): Observable<Candidate> {
    if (!environment.useMock) {
      return this.http.put<Candidate>(`${this.apiUrl}/${candidateId}`, changes);
    }
    const index = this.candidates.findIndex(c => String(c.candidate_id) === String(candidateId));
    if (index === -1) {
      throw new Error(`Candidate with ID ${candidateId} not found.`);
    }

    const updated: Candidate = {
      ...this.candidates[index],
      ...changes,
      candidate_id: this.candidates[index].candidate_id
    };

    this.candidates[index] = updated;
    this.candidates = [...this.candidates];
    return of({ ...updated }).pipe(delay(300));
  }

  public updateStatus(
    candidateId: string | number,
    status: string,
    interviewDate?: string | null,
    interviewResult?: string | null
  ): Observable<Candidate> {
    if (!environment.useMock) {
      return this.http.put<Candidate>(`${this.apiUrl}/${candidateId}/status`, {
        application_status: status,
        interview_date: interviewDate !== undefined ? interviewDate : null,
        interview_result: interviewResult !== undefined ? interviewResult : null
      });
    }

    return this.update(candidateId, {
      application_status: status,
      interview_date: interviewDate !== undefined ? interviewDate : null,
      interview_result: interviewResult !== undefined ? interviewResult : null
    });
  }


  /**
   * Delete candidate
   */
  public delete(candidateId: string | number): Observable<boolean> {
    if (!environment.useMock) {
      return this.http.delete<boolean>(`${this.apiUrl}/${candidateId}`);
    }
    const index = this.candidates.findIndex(c => String(c.candidate_id) === String(candidateId));
    if (index !== -1) {
      this.candidates.splice(index, 1);
      this.candidates = [...this.candidates];
      return of(true).pipe(delay(300));
    }
    return of(false).pipe(delay(200));
  }
}
