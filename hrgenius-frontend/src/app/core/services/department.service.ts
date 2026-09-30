import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Department } from '../models/department.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/departments`;

  // 8 sample departments as in-memory mock store
  private departments: Department[] = [
    {
      department_id: 1,
      department_name: 'Engineering & Technology',
      description: 'Software development, infrastructure, architecture, DevOps, and quality assurance.',
      department_head: 'Alex Mercer',
      status: 'Active'
    },
    {
      department_id: 2,
      department_name: 'Human Resources',
      description: 'Talent acquisition, employee relations, organizational development, and compliance.',
      department_head: 'Sarah Jenkins',
      status: 'Active'
    },
    {
      department_id: 3,
      department_name: 'Finance & Accounting',
      description: 'Financial reporting, budgets, treasury, audits, and compensation administration.',
      department_head: 'Robert Sterling',
      status: 'Active'
    },
    {
      department_id: 4,
      department_name: 'Marketing & Brand',
      description: 'Brand strategy, corporate communications, digital marketing, and market research.',
      department_head: 'Claire Henderson',
      status: 'Active'
    },
    {
      department_id: 5,
      department_name: 'Product & Design',
      description: 'Product lifecycle strategy, roadmapping, UI/UX design, and user insights.',
      department_head: 'Elena Rostova',
      status: 'Active'
    },
    {
      department_id: 6,
      department_name: 'Sales & Partnerships',
      description: 'Enterprise accounts, direct sales, partner alliances, and client acquisition.',
      department_head: 'David Zhao',
      status: 'Active'
    },
    {
      department_id: 7,
      department_name: 'Customer Success & Support',
      description: 'Client onboarding, retention, technical support helpdesk, and SLA management.',
      department_head: 'Michael Chang',
      status: 'Active'
    },
    {
      department_id: 8,
      department_name: 'Legal & Compliance',
      description: 'Corporate law, contract analysis, governance policies, and data privacy.',
      department_head: 'Victoria Bennett',
      status: 'Inactive'
    }
  ];

  /**
   * Retrieve all departments
   */
  public getAll(): Observable<Department[]> {
    if (!environment.useMock) {
      return this.http.get<Department[]>(this.apiUrl);
    }
    return of([...this.departments]).pipe(delay(250));
  }

  /**
   * Retrieve a single department by ID
   */
  public getById(id: string | number): Observable<Department | undefined> {
    if (!environment.useMock) {
      return this.http.get<Department>(`${this.apiUrl}/${id}`);
    }
    const dept = this.departments.find(d => String(d.department_id) === String(id));
    return of(dept ? { ...dept } : undefined).pipe(delay(200));
  }

  /**
   * Create a new department
   */
  public create(department: Omit<Department, 'department_id'>): Observable<Department> {
    if (!environment.useMock) {
      return this.http.post<Department>(this.apiUrl, department);
    }
    const nextId = this.departments.length > 0
      ? Math.max(...this.departments.map(d => Number(d.department_id) || 0)) + 1
      : 1;

    const newDepartment: Department = {
      ...department,
      department_id: nextId
    };

    this.departments = [newDepartment, ...this.departments];
    return of({ ...newDepartment }).pipe(delay(300));
  }

  /**
   * Update an existing department
   */
  public update(id: string | number, changes: Partial<Department>): Observable<Department> {
    if (!environment.useMock) {
      return this.http.put<Department>(`${this.apiUrl}/${id}`, changes);
    }
    const index = this.departments.findIndex(d => String(d.department_id) === String(id));
    if (index === -1) {
      throw new Error(`Department with ID ${id} not found.`);
    }

    const updatedDepartment: Department = {
      ...this.departments[index],
      ...changes,
      department_id: this.departments[index].department_id // preserve original ID
    };

    this.departments[index] = updatedDepartment;
    this.departments = [...this.departments];
    return of({ ...updatedDepartment }).pipe(delay(300));
  }

  /**
   * Delete a department by ID
   */
  public delete(id: string | number): Observable<boolean> {
    if (!environment.useMock) {
      return this.http.delete<boolean>(`${this.apiUrl}/${id}`);
    }
    const index = this.departments.findIndex(d => String(d.department_id) === String(id));
    if (index !== -1) {
      this.departments.splice(index, 1);
      this.departments = [...this.departments];
      return of(true).pipe(delay(300));
    }
    return of(false).pipe(delay(200));
  }
}
