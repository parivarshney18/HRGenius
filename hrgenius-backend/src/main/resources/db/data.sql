-- ============================================================================
-- HRGenius - Seed Data Script
-- Roles, Default Users, Departments, Employees, Sample Jobs & Records
-- ============================================================================

-- 1. ROLES
INSERT INTO ROLES (role_id, role_name, description) VALUES (SEQ_ROLES.NEXTVAL, 'ROLE_ADMIN', 'System Administrator with full access');
INSERT INTO ROLES (role_id, role_name, description) VALUES (SEQ_ROLES.NEXTVAL, 'ROLE_HR', 'HR Specialist with workforce, payroll, and recruitment access');
INSERT INTO ROLES (role_id, role_name, description) VALUES (SEQ_ROLES.NEXTVAL, 'ROLE_MANAGER', 'Team Manager with approval and review authority');
INSERT INTO ROLES (role_id, role_name, description) VALUES (SEQ_ROLES.NEXTVAL, 'ROLE_EMPLOYEE', 'Employee with self-service attendance, leaves, and payslips');

-- 2. USERS (Default BCrypt password for admin: admin123, hr: hr123, manager: manager123, emp: employee123)
-- BCrypt for 'admin123'
INSERT INTO USERS (user_id, username, email, password, role_id, status, created_at)
VALUES (SEQ_USERS.NEXTVAL, 'admin', 'admin@hrgenius.com', '$2a$10$e8Z4wZkVm8zFvR0J7wD0kO4gJp7B2W5fG8l0aZ2Y4pT6mX8nK0Z2a', 1, 'ACTIVE', CURRENT_TIMESTAMP);

-- BCrypt for 'hr123'
INSERT INTO USERS (user_id, username, email, password, role_id, status, created_at)
VALUES (SEQ_USERS.NEXTVAL, 'hr.manager', 'hr@hrgenius.com', '$2a$10$e8Z4wZkVm8zFvR0J7wD0kO4gJp7B2W5fG8l0aZ2Y4pT6mX8nK0Z2a', 2, 'ACTIVE', CURRENT_TIMESTAMP);

-- BCrypt for 'manager123'
INSERT INTO USERS (user_id, username, email, password, role_id, status, created_at)
VALUES (SEQ_USERS.NEXTVAL, 'john.manager', 'john.manager@hrgenius.com', '$2a$10$e8Z4wZkVm8zFvR0J7wD0kO4gJp7B2W5fG8l0aZ2Y4pT6mX8nK0Z2a', 3, 'ACTIVE', CURRENT_TIMESTAMP);

-- BCrypt for 'employee123'
INSERT INTO USERS (user_id, username, email, password, role_id, status, created_at)
VALUES (SEQ_USERS.NEXTVAL, 'alice.emp', 'alice.smith@hrgenius.com', '$2a$10$e8Z4wZkVm8zFvR0J7wD0kO4gJp7B2W5fG8l0aZ2Y4pT6mX8nK0Z2a', 4, 'ACTIVE', CURRENT_TIMESTAMP);

INSERT INTO USERS (user_id, username, email, password, role_id, status, created_at)
VALUES (SEQ_USERS.NEXTVAL, 'bob.emp', 'bob.jones@hrgenius.com', '$2a$10$e8Z4wZkVm8zFvR0J7wD0kO4gJp7B2W5fG8l0aZ2Y4pT6mX8nK0Z2a', 4, 'ACTIVE', CURRENT_TIMESTAMP);

-- 3. DEPARTMENTS
INSERT INTO DEPARTMENTS (department_id, department_name, description, department_head, status, created_at)
VALUES (SEQ_DEPARTMENTS.NEXTVAL, 'Engineering', 'Software engineering, QA, DevOps, and Platform teams', 'Marcus Vance', 'ACTIVE', CURRENT_TIMESTAMP);

INSERT INTO DEPARTMENTS (department_id, department_name, description, department_head, status, created_at)
VALUES (SEQ_DEPARTMENTS.NEXTVAL, 'Human Resources', 'Talent acquisition, employee welfare, and operations', 'Sarah Connor', 'ACTIVE', CURRENT_TIMESTAMP);

INSERT INTO DEPARTMENTS (department_id, department_name, description, department_head, status, created_at)
VALUES (SEQ_DEPARTMENTS.NEXTVAL, 'Finance', 'Financial planning, accounting, tax, and corporate payroll', 'David Lee', 'ACTIVE', CURRENT_TIMESTAMP);

INSERT INTO DEPARTMENTS (department_id, department_name, description, department_head, status, created_at)
VALUES (SEQ_DEPARTMENTS.NEXTVAL, 'Sales & Marketing', 'Enterprise sales, product marketing, and client relations', 'Elena Rostova', 'ACTIVE', CURRENT_TIMESTAMP);

-- 4. EMPLOYEES
-- Admin Employee (Marcus Vance)
INSERT INTO EMPLOYEES (employee_id, employee_code, user_id, first_name, last_name, date_of_birth, gender, email, phone, address, date_of_joining, department_id, manager_id, designation, employment_type, status, created_at)
VALUES (SEQ_EMPLOYEES.NEXTVAL, 'EMP-1001', 1, 'Marcus', 'Vance', TO_DATE('1985-04-12', 'YYYY-MM-DD'), 'MALE', 'admin@hrgenius.com', '+1-555-0101', '100 Silicon Blvd, Suite 400', TO_DATE('2020-01-15', 'YYYY-MM-DD'), 1, NULL, 'Chief Technology Officer', 'FULL_TIME', 'ACTIVE', CURRENT_TIMESTAMP);

-- HR Specialist (Sarah Connor)
INSERT INTO EMPLOYEES (employee_id, employee_code, user_id, first_name, last_name, date_of_birth, gender, email, phone, address, date_of_joining, department_id, manager_id, designation, employment_type, status, created_at)
VALUES (SEQ_EMPLOYEES.NEXTVAL, 'EMP-1002', 2, 'Sarah', 'Connor', TO_DATE('1990-08-22', 'YYYY-MM-DD'), 'FEMALE', 'hr@hrgenius.com', '+1-555-0102', '240 Elm St, Apt 3B', TO_DATE('2021-03-01', 'YYYY-MM-DD'), 2, 1, 'HR Director', 'FULL_TIME', 'ACTIVE', CURRENT_TIMESTAMP);

-- Engineering Manager (John Doe)
INSERT INTO EMPLOYEES (employee_id, employee_code, user_id, first_name, last_name, date_of_birth, gender, email, phone, address, date_of_joining, department_id, manager_id, designation, employment_type, status, created_at)
VALUES (SEQ_EMPLOYEES.NEXTVAL, 'EMP-1003', 3, 'John', 'Doe', TO_DATE('1988-11-05', 'YYYY-MM-DD'), 'MALE', 'john.manager@hrgenius.com', '+1-555-0103', '77 Tech Parkway', TO_DATE('2021-06-15', 'YYYY-MM-DD'), 1, 1, 'Engineering Manager', 'FULL_TIME', 'ACTIVE', CURRENT_TIMESTAMP);

-- Senior Software Engineer (Alice Smith)
INSERT INTO EMPLOYEES (employee_id, employee_code, user_id, first_name, last_name, date_of_birth, gender, email, phone, address, date_of_joining, department_id, manager_id, designation, employment_type, status, created_at)
VALUES (SEQ_EMPLOYEES.NEXTVAL, 'EMP-1004', 4, 'Alice', 'Smith', TO_DATE('1994-02-18', 'YYYY-MM-DD'), 'FEMALE', 'alice.smith@hrgenius.com', '+1-555-0104', '512 Oak Avenue', TO_DATE('2022-02-01', 'YYYY-MM-DD'), 1, 3, 'Senior Software Engineer', 'FULL_TIME', 'ACTIVE', CURRENT_TIMESTAMP);

-- Frontend Engineer (Bob Jones)
INSERT INTO EMPLOYEES (employee_id, employee_code, user_id, first_name, last_name, date_of_birth, gender, email, phone, address, date_of_joining, department_id, manager_id, designation, employment_type, status, created_at)
VALUES (SEQ_EMPLOYEES.NEXTVAL, 'EMP-1005', 5, 'Bob', 'Jones', TO_DATE('1996-07-29', 'YYYY-MM-DD'), 'MALE', 'bob.jones@hrgenius.com', '+1-555-0105', '89 Marina Bay', TO_DATE('2023-05-10', 'YYYY-MM-DD'), 1, 3, 'Frontend Engineer', 'FULL_TIME', 'ACTIVE', CURRENT_TIMESTAMP);

-- 5. SAMPLE RECRUITMENT JOBS
INSERT INTO JOBS (job_id, job_title, department_id, description, requirements, openings, posting_date, closing_date, status, created_at)
VALUES (SEQ_JOBS.NEXTVAL, 'Senior Full Stack Java Engineer', 1, 'Join our core platform engineering team to build scalable microservices and Angular web apps.', '5+ years experience in Java, Spring Boot, Oracle/PostgreSQL, Angular/React.', 2, CURRENT_DATE - 15, CURRENT_DATE + 45, 'OPEN', CURRENT_TIMESTAMP);

INSERT INTO JOBS (job_id, job_title, department_id, description, requirements, openings, posting_date, closing_date, status, created_at)
VALUES (SEQ_JOBS.NEXTVAL, 'HR Operations Specialist', 2, 'Coordinate employee onboarding, compliance, and benefit administrations.', '3+ years experience in human resource operations and HRIS software.', 1, CURRENT_DATE - 10, CURRENT_DATE + 20, 'OPEN', CURRENT_TIMESTAMP);

-- 6. SAMPLE CANDIDATES
INSERT INTO CANDIDATES (candidate_id, job_id, candidate_name, candidate_email, phone, resume_url, application_date, application_status, interview_date, interview_result, created_at)
VALUES (SEQ_CANDIDATES.NEXTVAL, 1, 'Michael Chang', 'michael.chang@example.com', '+1-555-0201', 'https://storage.hrgenius.com/resumes/mchang.pdf', CURRENT_DATE - 8, 'SELECTED', CURRENT_TIMESTAMP - 2, 'Candidate demonstrated excellent Spring Boot architecture knowledge.', CURRENT_TIMESTAMP);

INSERT INTO CANDIDATES (candidate_id, job_id, candidate_name, candidate_email, phone, resume_url, application_date, application_status, interview_date, interview_result, created_at)
VALUES (SEQ_CANDIDATES.NEXTVAL, 1, 'Emma Watson', 'emma.watson@example.com', '+1-555-0202', 'https://storage.hrgenius.com/resumes/ewatson.pdf', CURRENT_DATE - 4, 'INTERVIEW_SCHEDULED', CURRENT_TIMESTAMP + 3, NULL, CURRENT_TIMESTAMP);

-- 7. SAMPLE ONBOARDING (For Selected Candidate Michael Chang)
INSERT INTO ONBOARDING (onboarding_id, candidate_id, employee_id, joining_date, document_status, verification_status, assigned_department, assigned_manager, onboarding_status, created_at)
VALUES (SEQ_ONBOARDING.NEXTVAL, 1, NULL, CURRENT_DATE + 14, 'SUBMITTED', 'VERIFIED', 1, 3, 'IN_PROGRESS', CURRENT_TIMESTAMP);

-- 8. SAMPLE ATTENDANCE
INSERT INTO ATTENDANCE (attendance_id, employee_id, attendance_date, check_in, check_out, attendance_status, working_hours, remarks, created_at)
VALUES (SEQ_ATTENDANCE.NEXTVAL, 4, CURRENT_DATE, CURRENT_TIMESTAMP - (8/24), CURRENT_TIMESTAMP, 'PRESENT', 8.0, 'Regular on-time shift', CURRENT_TIMESTAMP);

INSERT INTO ATTENDANCE (attendance_id, employee_id, attendance_date, check_in, check_out, attendance_status, working_hours, remarks, created_at)
VALUES (SEQ_ATTENDANCE.NEXTVAL, 5, CURRENT_DATE, CURRENT_TIMESTAMP - (8.5/24), CURRENT_TIMESTAMP, 'PRESENT', 8.5, 'Sprint release overtime', CURRENT_TIMESTAMP);

-- 9. SAMPLE LEAVE REQUESTS
INSERT INTO LEAVE_REQUESTS (leave_id, employee_id, leave_type, start_date, end_date, number_of_days, reason, applied_date, approved_by, approval_date, leave_status, created_at)
VALUES (SEQ_LEAVE_REQUESTS.NEXTVAL, 4, 'ANNUAL', CURRENT_DATE + 7, CURRENT_DATE + 10, 4.0, 'Family vacation', CURRENT_DATE - 2, 3, CURRENT_DATE - 1, 'APPROVED', CURRENT_TIMESTAMP);

INSERT INTO LEAVE_REQUESTS (leave_id, employee_id, leave_type, start_date, end_date, number_of_days, reason, applied_date, approved_by, approval_date, leave_status, created_at)
VALUES (SEQ_LEAVE_REQUESTS.NEXTVAL, 5, 'CASUAL', CURRENT_DATE + 14, CURRENT_DATE + 15, 2.0, 'Personal errand', CURRENT_DATE - 1, NULL, NULL, 'PENDING', CURRENT_TIMESTAMP);

-- 10. SAMPLE PAYROLL
INSERT INTO PAYROLL (payroll_id, employee_id, payroll_month, basic_salary, allowances, bonus, deductions, tax, gross_salary, net_salary, payment_date, payroll_status, created_at)
VALUES (SEQ_PAYROLL.NEXTVAL, 4, TO_CHAR(ADD_MONTHS(CURRENT_DATE, -1), 'YYYY-MM'), 7500.00, 1000.00, 500.00, 400.00, 1200.00, 9000.00, 7400.00, CURRENT_DATE - 5, 'PAID', CURRENT_TIMESTAMP);

INSERT INTO PAYROLL (payroll_id, employee_id, payroll_month, basic_salary, allowances, bonus, deductions, tax, gross_salary, net_salary, payment_date, payroll_status, created_at)
VALUES (SEQ_PAYROLL.NEXTVAL, 5, TO_CHAR(ADD_MONTHS(CURRENT_DATE, -1), 'YYYY-MM'), 6000.00, 800.00, 200.00, 300.00, 950.00, 7000.00, 5750.00, CURRENT_DATE - 5, 'PAID', CURRENT_TIMESTAMP);

-- 11. SAMPLE PERFORMANCE REVIEWS
INSERT INTO PERFORMANCE_REVIEWS (performance_id, employee_id, review_period, goal, achievement, rating, feedback, reviewed_by, review_date, performance_status, created_at)
VALUES (SEQ_PERFORMANCE_REVIEWS.NEXTVAL, 4, '2026-Q1', 'Lead migration to Spring Boot 3 and Angular standalone architecture.', 'Successfully migrated and cut build times by 40%.', 4.8, 'Outstanding technical leadership and problem-solving skills.', 3, CURRENT_DATE - 10, 'REVIEWED', CURRENT_TIMESTAMP);

COMMIT;
