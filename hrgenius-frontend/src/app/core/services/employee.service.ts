import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Employee } from '../models/employee.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/employees`;

  // 15 mock employees linked to departments (1-8) and managers
  private employees: Employee[] = [
    {
      employee_id: 1,
      employee_code: 'EMP-001',
      first_name: 'Alex',
      last_name: 'Mercer',
      date_of_birth: '1985-04-12',
      gender: 'Male',
      email: 'alex.mercer@hrgenius.com',
      phone: '+1 (555) 234-5678',
      address: '742 Evergreen Terrace, Springfield, OR',
      date_of_joining: '2020-01-15',
      department_id: 1,
      manager_id: null,
      designation: 'VP of Technology',
      employment_type: 'Full-Time',
      status: 'Active'
    },
    {
      employee_id: 2,
      employee_code: 'EMP-002',
      first_name: 'Sarah',
      last_name: 'Jenkins',
      date_of_birth: '1988-09-23',
      gender: 'Female',
      email: 'sarah.jenkins@hrgenius.com',
      phone: '+1 (555) 345-6789',
      address: '124 Conch Street, Pacific City, WA',
      date_of_joining: '2020-03-01',
      department_id: 2,
      manager_id: null,
      designation: 'HR Operations Lead',
      employment_type: 'Full-Time',
      status: 'Active'
    },
    {
      employee_id: 3,
      employee_code: 'EMP-003',
      first_name: 'Robert',
      last_name: 'Sterling',
      date_of_birth: '1982-11-05',
      gender: 'Male',
      email: 'robert.sterling@hrgenius.com',
      phone: '+1 (555) 456-7890',
      address: '89 Wall Street, Financial District, NY',
      date_of_joining: '2019-08-10',
      department_id: 3,
      manager_id: null,
      designation: 'Chief Financial Officer',
      employment_type: 'Full-Time',
      status: 'Active'
    },
    {
      employee_id: 4,
      employee_code: 'EMP-004',
      first_name: 'Marcus',
      last_name: 'Vance',
      date_of_birth: '1990-06-18',
      gender: 'Male',
      email: 'marcus.vance@hrgenius.com',
      phone: '+1 (555) 567-8901',
      address: '350 5th Avenue, New York, NY',
      date_of_joining: '2021-02-15',
      department_id: 1,
      manager_id: 1,
      designation: 'Engineering Manager',
      employment_type: 'Full-Time',
      status: 'Active'
    },
    {
      employee_id: 5,
      employee_code: 'EMP-005',
      first_name: 'Elena',
      last_name: 'Rostova',
      date_of_birth: '1992-02-14',
      gender: 'Female',
      email: 'elena.rostova@hrgenius.com',
      phone: '+1 (555) 678-9012',
      address: '500 Howard Street, San Francisco, CA',
      date_of_joining: '2021-05-20',
      department_id: 5,
      manager_id: null,
      designation: 'Head of Product Design',
      employment_type: 'Full-Time',
      status: 'Active'
    },
    {
      employee_id: 6,
      employee_code: 'EMP-006',
      first_name: 'Liam',
      last_name: 'Walker',
      date_of_birth: '1994-08-30',
      gender: 'Male',
      email: 'liam.walker@hrgenius.com',
      phone: '+1 (555) 789-0123',
      address: '221B Baker Street, Londonderry, NH',
      date_of_joining: '2022-01-10',
      department_id: 1,
      manager_id: 4,
      designation: 'Senior Full Stack Engineer',
      employment_type: 'Full-Time',
      status: 'Active'
    },
    {
      employee_id: 7,
      employee_code: 'EMP-007',
      first_name: 'Sophia',
      last_name: 'Chen',
      date_of_birth: '1996-03-22',
      gender: 'Female',
      email: 'sophia.chen@hrgenius.com',
      phone: '+1 (555) 890-1234',
      address: '100 University Avenue, Palo Alto, CA',
      date_of_joining: '2022-06-15',
      department_id: 1,
      manager_id: 4,
      designation: 'Frontend Angular Developer',
      employment_type: 'Full-Time',
      status: 'Active'
    },
    {
      employee_id: 8,
      employee_code: 'EMP-008',
      first_name: 'Daniel',
      last_name: 'Miller',
      date_of_birth: '1989-12-03',
      gender: 'Male',
      email: 'daniel.miller@hrgenius.com',
      phone: '+1 (555) 901-2345',
      address: '1600 Amphitheatre Parkway, Mountain View, CA',
      date_of_joining: '2021-09-01',
      department_id: 1,
      manager_id: 1,
      designation: 'DevOps & Cloud Architect',
      employment_type: 'Full-Time',
      status: 'Active'
    },
    {
      employee_id: 9,
      employee_code: 'EMP-009',
      first_name: 'Olivia',
      last_name: 'Davis',
      date_of_birth: '1995-07-19',
      gender: 'Female',
      email: 'olivia.davis@hrgenius.com',
      phone: '+1 (555) 012-3456',
      address: '42 Wallaby Way, Sydney, FL',
      date_of_joining: '2023-01-05',
      department_id: 2,
      manager_id: 2,
      designation: 'Talent Acquisition Specialist',
      employment_type: 'Full-Time',
      status: 'Active'
    },
    {
      employee_id: 10,
      employee_code: 'EMP-010',
      first_name: 'Ethan',
      last_name: 'Taylor',
      date_of_birth: '1991-10-11',
      gender: 'Male',
      email: 'ethan.taylor@hrgenius.com',
      phone: '+1 (555) 123-4567',
      address: '77 Massachusetts Avenue, Cambridge, MA',
      date_of_joining: '2021-11-15',
      department_id: 3,
      manager_id: 3,
      designation: 'Senior Financial Analyst',
      employment_type: 'Full-Time',
      status: 'Active'
    },
    {
      employee_id: 11,
      employee_code: 'EMP-011',
      first_name: 'Maya',
      last_name: 'Patel',
      date_of_birth: '1993-05-17',
      gender: 'Female',
      email: 'maya.patel@hrgenius.com',
      phone: '+1 (555) 234-8901',
      address: '88 Michigan Avenue, Chicago, IL',
      date_of_joining: '2022-04-01',
      department_id: 4,
      manager_id: null,
      designation: 'Brand & Communications Lead',
      employment_type: 'Full-Time',
      status: 'Active'
    },
    {
      employee_id: 12,
      employee_code: 'EMP-012',
      first_name: 'Noah',
      last_name: 'Wilson',
      date_of_birth: '1997-09-08',
      gender: 'Male',
      email: 'noah.wilson@hrgenius.com',
      phone: '+1 (555) 345-9012',
      address: '150 2nd Street, Austin, TX',
      date_of_joining: '2023-03-15',
      department_id: 5,
      manager_id: 5,
      designation: 'UI/UX Visual Designer',
      employment_type: 'Contract',
      status: 'Active'
    },
    {
      employee_id: 13,
      employee_code: 'EMP-013',
      first_name: 'Isabella',
      last_name: 'Garcia',
      date_of_birth: '1990-01-25',
      gender: 'Female',
      email: 'isabella.garcia@hrgenius.com',
      phone: '+1 (555) 456-0123',
      address: '400 Pine Street, Seattle, WA',
      date_of_joining: '2021-07-01',
      department_id: 6,
      manager_id: null,
      designation: 'Enterprise Account Executive',
      employment_type: 'Full-Time',
      status: 'Active'
    },
    {
      employee_id: 14,
      employee_code: 'EMP-014',
      first_name: 'Lucas',
      last_name: 'Brown',
      date_of_birth: '1994-11-30',
      gender: 'Male',
      email: 'lucas.brown@hrgenius.com',
      phone: '+1 (555) 567-1234',
      address: '300 Boulder Highway, Denver, CO',
      date_of_joining: '2022-08-20',
      department_id: 7,
      manager_id: null,
      designation: 'Customer Support Lead',
      employment_type: 'Full-Time',
      status: 'Active'
    },
    {
      employee_id: 15,
      employee_code: 'EMP-015',
      first_name: 'Emma',
      last_name: 'Thomas',
      date_of_birth: '1987-04-05',
      gender: 'Female',
      email: 'emma.thomas@hrgenius.com',
      phone: '+1 (555) 678-2345',
      address: '1000 K Street NW, Washington, DC',
      date_of_joining: '2020-10-15',
      department_id: 8,
      manager_id: null,
      designation: 'Regulatory Compliance Officer',
      employment_type: 'Full-Time',
      status: 'Inactive'
    }
  ];

  /**
   * Retrieve all employees
   */
  public getAll(): Observable<Employee[]> {
    if (!environment.useMock) {
      return this.http.get<Employee[]>(this.apiUrl);
    }
    return of([...this.employees]).pipe(delay(250));
  }

  /**
   * Retrieve employee by ID
   */
  public getById(id: string | number): Observable<Employee | undefined> {
    if (!environment.useMock) {
      return this.http.get<Employee>(`${this.apiUrl}/${id}`);
    }
    const emp = this.employees.find(e => String(e.employee_id) === String(id));
    return of(emp ? { ...emp } : undefined).pipe(delay(200));
  }

  /**
   * Retrieve employees by department ID
   */
  public getByDepartment(deptId: string | number): Observable<Employee[]> {
    if (!environment.useMock) {
      return this.http.get<Employee[]>(`${this.apiUrl}/department/${deptId}`);
    }
    const filtered = this.employees.filter(e => String(e.department_id) === String(deptId));
    return of([...filtered]).pipe(delay(200));
  }

  /**
   * Create a new employee
   */
  public create(employee: Omit<Employee, 'employee_id'>): Observable<Employee> {
    if (!environment.useMock) {
      return this.http.post<Employee>(this.apiUrl, employee);
    }
    const nextId = this.employees.length > 0
      ? Math.max(...this.employees.map(e => Number(e.employee_id) || 0)) + 1
      : 1;

    // Auto-generate employee code if missing
    const code = employee.employee_code || `EMP-${String(nextId).padStart(3, '0')}`;

    const newEmployee: Employee = {
      ...employee,
      employee_id: nextId,
      employee_code: code
    };

    this.employees = [newEmployee, ...this.employees];
    return of({ ...newEmployee }).pipe(delay(300));
  }

  /**
   * Update an existing employee
   */
  public update(id: string | number, changes: Partial<Employee>): Observable<Employee> {
    if (!environment.useMock) {
      return this.http.put<Employee>(`${this.apiUrl}/${id}`, changes);
    }
    const index = this.employees.findIndex(e => String(e.employee_id) === String(id));
    if (index === -1) {
      throw new Error(`Employee with ID ${id} not found.`);
    }

    const updatedEmployee: Employee = {
      ...this.employees[index],
      ...changes,
      employee_id: this.employees[index].employee_id
    };

    this.employees[index] = updatedEmployee;
    this.employees = [...this.employees];
    return of({ ...updatedEmployee }).pipe(delay(300));
  }

  /**
   * Delete an employee by ID
   */
  public delete(id: string | number): Observable<boolean> {
    if (!environment.useMock) {
      return this.http.delete<boolean>(`${this.apiUrl}/${id}`);
    }
    const index = this.employees.findIndex(e => String(e.employee_id) === String(id));
    if (index !== -1) {
      this.employees.splice(index, 1);
      this.employees = [...this.employees];
      return of(true).pipe(delay(300));
    }
    return of(false).pipe(delay(200));
  }
}
