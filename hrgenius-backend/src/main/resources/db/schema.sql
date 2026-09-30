-- ============================================================================
-- HRGenius - Human Resource Management System
-- Oracle Database DDL Schema Script
-- Compatible with Oracle 19c, 21c, 23ai
-- ============================================================================

-- Drop tables and sequences in reverse order if they exist
BEGIN
    FOR t IN (SELECT table_name FROM user_tables WHERE table_name IN (
        'PERFORMANCE_REVIEWS', 'PAYROLL', 'LEAVE_REQUESTS', 'ATTENDANCE',
        'ONBOARDING', 'CANDIDATES', 'JOBS', 'EMPLOYEES', 'DEPARTMENTS',
        'USERS', 'ROLES'
    )) LOOP
        EXECUTE IMMEDIATE 'DROP TABLE ' || t.table_name || ' CASCADE CONSTRAINTS';
    END LOOP;

    FOR s IN (SELECT sequence_name FROM user_sequences WHERE sequence_name IN (
        'SEQ_ROLES', 'SEQ_USERS', 'SEQ_DEPARTMENTS', 'SEQ_EMPLOYEES',
        'SEQ_JOBS', 'SEQ_CANDIDATES', 'SEQ_ONBOARDING', 'SEQ_ATTENDANCE',
        'SEQ_LEAVE_REQUESTS', 'SEQ_PAYROLL', 'SEQ_PERFORMANCE_REVIEWS'
    )) LOOP
        EXECUTE IMMEDIATE 'DROP SEQUENCE ' || s.sequence_name;
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

-- ============================================================================
-- 1. SEQUENCES
-- ============================================================================
CREATE SEQUENCE SEQ_ROLES START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_USERS START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_DEPARTMENTS START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_EMPLOYEES START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_JOBS START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_CANDIDATES START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_ONBOARDING START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_ATTENDANCE START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_LEAVE_REQUESTS START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_PAYROLL START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_PERFORMANCE_REVIEWS START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

-- ============================================================================
-- 2. ROLES TABLE
-- ============================================================================
CREATE TABLE ROLES (
    role_id NUMBER(10) NOT NULL,
    role_name VARCHAR2(50) NOT NULL,
    description VARCHAR2(255),
    CONSTRAINT PK_ROLES PRIMARY KEY (role_id),
    CONSTRAINT UK_ROLES_NAME UNIQUE (role_name)
);

-- ============================================================================
-- 3. USERS TABLE
-- ============================================================================
CREATE TABLE USERS (
    user_id NUMBER(10) NOT NULL,
    username VARCHAR2(100) NOT NULL,
    email VARCHAR2(150) NOT NULL,
    password VARCHAR2(255) NOT NULL,
    role_id NUMBER(10) NOT NULL,
    status VARCHAR2(20) DEFAULT 'ACTIVE' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    last_login TIMESTAMP,
    CONSTRAINT PK_USERS PRIMARY KEY (user_id),
    CONSTRAINT UK_USERS_USERNAME UNIQUE (username),
    CONSTRAINT UK_USERS_EMAIL UNIQUE (email),
    CONSTRAINT FK_USERS_ROLE FOREIGN KEY (role_id) REFERENCES ROLES(role_id),
    CONSTRAINT CHK_USERS_STATUS CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED'))
);

-- ============================================================================
-- 4. DEPARTMENTS TABLE
-- ============================================================================
CREATE TABLE DEPARTMENTS (
    department_id NUMBER(10) NOT NULL,
    department_name VARCHAR2(100) NOT NULL,
    description VARCHAR2(500),
    department_head VARCHAR2(100),
    status VARCHAR2(20) DEFAULT 'ACTIVE' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    CONSTRAINT PK_DEPARTMENTS PRIMARY KEY (department_id),
    CONSTRAINT UK_DEPT_NAME UNIQUE (department_name),
    CONSTRAINT CHK_DEPT_STATUS CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

-- ============================================================================
-- 5. EMPLOYEES TABLE
-- ============================================================================
CREATE TABLE EMPLOYEES (
    employee_id NUMBER(10) NOT NULL,
    employee_code VARCHAR2(50) NOT NULL,
    user_id NUMBER(10),
    first_name VARCHAR2(100) NOT NULL,
    last_name VARCHAR2(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR2(20) NOT NULL,
    email VARCHAR2(150) NOT NULL,
    phone VARCHAR2(30),
    address VARCHAR2(500),
    date_of_joining DATE NOT NULL,
    department_id NUMBER(10) NOT NULL,
    manager_id NUMBER(10),
    designation VARCHAR2(100) NOT NULL,
    employment_type VARCHAR2(50) DEFAULT 'FULL_TIME' NOT NULL,
    status VARCHAR2(20) DEFAULT 'ACTIVE' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    CONSTRAINT PK_EMPLOYEES PRIMARY KEY (employee_id),
    CONSTRAINT UK_EMPLOYEES_CODE UNIQUE (employee_code),
    CONSTRAINT UK_EMPLOYEES_EMAIL UNIQUE (email),
    CONSTRAINT UK_EMPLOYEES_USER UNIQUE (user_id),
    CONSTRAINT FK_EMP_USER FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE SET NULL,
    CONSTRAINT FK_EMP_DEPT FOREIGN KEY (department_id) REFERENCES DEPARTMENTS(department_id),
    CONSTRAINT FK_EMP_MANAGER FOREIGN KEY (manager_id) REFERENCES EMPLOYEES(employee_id),
    CONSTRAINT CHK_EMP_GENDER CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    CONSTRAINT CHK_EMP_TYPE CHECK (employment_type IN ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN')),
    CONSTRAINT CHK_EMP_STATUS CHECK (status IN ('ACTIVE', 'ON_LEAVE', 'TERMINATED', 'RESIGNED'))
);

-- ============================================================================
-- 6. JOBS (RECRUITMENT) TABLE
-- ============================================================================
CREATE TABLE JOBS (
    job_id NUMBER(10) NOT NULL,
    job_title VARCHAR2(150) NOT NULL,
    department_id NUMBER(10) NOT NULL,
    description CLOB,
    requirements CLOB,
    openings NUMBER(5) DEFAULT 1 NOT NULL,
    posting_date DATE DEFAULT CURRENT_DATE NOT NULL,
    closing_date DATE,
    status VARCHAR2(20) DEFAULT 'OPEN' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    CONSTRAINT PK_JOBS PRIMARY KEY (job_id),
    CONSTRAINT FK_JOBS_DEPT FOREIGN KEY (department_id) REFERENCES DEPARTMENTS(department_id),
    CONSTRAINT CHK_JOBS_STATUS CHECK (status IN ('OPEN', 'CLOSED', 'ON_HOLD'))
);

-- ============================================================================
-- 7. CANDIDATES TABLE
-- ============================================================================
CREATE TABLE CANDIDATES (
    candidate_id NUMBER(10) NOT NULL,
    job_id NUMBER(10) NOT NULL,
    candidate_name VARCHAR2(150) NOT NULL,
    candidate_email VARCHAR2(150) NOT NULL,
    phone VARCHAR2(30),
    resume_url VARCHAR2(500),
    application_date DATE DEFAULT CURRENT_DATE NOT NULL,
    application_status VARCHAR2(30) DEFAULT 'APPLIED' NOT NULL,
    interview_date TIMESTAMP,
    interview_result VARCHAR2(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    CONSTRAINT PK_CANDIDATES PRIMARY KEY (candidate_id),
    CONSTRAINT FK_CANDIDATES_JOB FOREIGN KEY (job_id) REFERENCES JOBS(job_id),
    CONSTRAINT CHK_CAND_STATUS CHECK (application_status IN ('APPLIED', 'SCREENED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'REJECTED'))
);

-- ============================================================================
-- 8. ONBOARDING TABLE
-- ============================================================================
CREATE TABLE ONBOARDING (
    onboarding_id NUMBER(10) NOT NULL,
    candidate_id NUMBER(10) NOT NULL,
    employee_id NUMBER(10),
    joining_date DATE NOT NULL,
    document_status VARCHAR2(30) DEFAULT 'PENDING' NOT NULL,
    verification_status VARCHAR2(30) DEFAULT 'PENDING' NOT NULL,
    assigned_department NUMBER(10) NOT NULL,
    assigned_manager NUMBER(10),
    onboarding_status VARCHAR2(30) DEFAULT 'IN_PROGRESS' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    CONSTRAINT PK_ONBOARDING PRIMARY KEY (onboarding_id),
    CONSTRAINT UK_ONBOARDING_CAND UNIQUE (candidate_id),
    CONSTRAINT UK_ONBOARDING_EMP UNIQUE (employee_id),
    CONSTRAINT FK_ONB_CANDIDATE FOREIGN KEY (candidate_id) REFERENCES CANDIDATES(candidate_id),
    CONSTRAINT FK_ONB_EMPLOYEE FOREIGN KEY (employee_id) REFERENCES EMPLOYEES(employee_id),
    CONSTRAINT FK_ONB_DEPT FOREIGN KEY (assigned_department) REFERENCES DEPARTMENTS(department_id),
    CONSTRAINT FK_ONB_MANAGER FOREIGN KEY (assigned_manager) REFERENCES EMPLOYEES(employee_id),
    CONSTRAINT CHK_ONB_DOC_STATUS CHECK (document_status IN ('PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED')),
    CONSTRAINT CHK_ONB_VERIF_STATUS CHECK (verification_status IN ('PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED')),
    CONSTRAINT CHK_ONB_STATUS CHECK (onboarding_status IN ('IN_PROGRESS', 'COMPLETED', 'CANCELLED'))
);

-- ============================================================================
-- 9. ATTENDANCE TABLE
-- ============================================================================
CREATE TABLE ATTENDANCE (
    attendance_id NUMBER(10) NOT NULL,
    employee_id NUMBER(10) NOT NULL,
    attendance_date DATE NOT NULL,
    check_in TIMESTAMP,
    check_out TIMESTAMP,
    attendance_status VARCHAR2(20) DEFAULT 'PRESENT' NOT NULL,
    working_hours NUMBER(5,2) DEFAULT 0.0,
    remarks VARCHAR2(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    CONSTRAINT PK_ATTENDANCE PRIMARY KEY (attendance_id),
    CONSTRAINT UK_ATTENDANCE_EMP_DATE UNIQUE (employee_id, attendance_date),
    CONSTRAINT FK_ATTENDANCE_EMP FOREIGN KEY (employee_id) REFERENCES EMPLOYEES(employee_id),
    CONSTRAINT CHK_ATT_STATUS CHECK (attendance_status IN ('PRESENT', 'ABSENT', 'HALF_DAY', 'LATE', 'ON_LEAVE'))
);

-- ============================================================================
-- 10. LEAVE_REQUESTS TABLE
-- ============================================================================
CREATE TABLE LEAVE_REQUESTS (
    leave_id NUMBER(10) NOT NULL,
    employee_id NUMBER(10) NOT NULL,
    leave_type VARCHAR2(30) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    number_of_days NUMBER(5,1) NOT NULL,
    reason VARCHAR2(500) NOT NULL,
    applied_date DATE DEFAULT CURRENT_DATE NOT NULL,
    approved_by NUMBER(10),
    approval_date DATE,
    leave_status VARCHAR2(20) DEFAULT 'PENDING' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    CONSTRAINT PK_LEAVE_REQUESTS PRIMARY KEY (leave_id),
    CONSTRAINT FK_LEAVE_EMP FOREIGN KEY (employee_id) REFERENCES EMPLOYEES(employee_id),
    CONSTRAINT FK_LEAVE_APPROVER FOREIGN KEY (approved_by) REFERENCES EMPLOYEES(employee_id),
    CONSTRAINT CHK_LEAVE_TYPE CHECK (leave_type IN ('CASUAL', 'SICK', 'ANNUAL', 'MATERNITY', 'PATERNITY', 'UNPAID')),
    CONSTRAINT CHK_LEAVE_STATUS CHECK (leave_status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'))
);

-- ============================================================================
-- 11. PAYROLL TABLE
-- ============================================================================
CREATE TABLE PAYROLL (
    payroll_id NUMBER(10) NOT NULL,
    employee_id NUMBER(10) NOT NULL,
    payroll_month VARCHAR2(7) NOT NULL, -- Format: YYYY-MM
    basic_salary NUMBER(12,2) NOT NULL,
    allowances NUMBER(12,2) DEFAULT 0 NOT NULL,
    bonus NUMBER(12,2) DEFAULT 0 NOT NULL,
    deductions NUMBER(12,2) DEFAULT 0 NOT NULL,
    tax NUMBER(12,2) DEFAULT 0 NOT NULL,
    gross_salary NUMBER(12,2) NOT NULL,
    net_salary NUMBER(12,2) NOT NULL,
    payment_date DATE,
    payroll_status VARCHAR2(20) DEFAULT 'DRAFT' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    CONSTRAINT PK_PAYROLL PRIMARY KEY (payroll_id),
    CONSTRAINT UK_PAYROLL_EMP_MONTH UNIQUE (employee_id, payroll_month),
    CONSTRAINT FK_PAYROLL_EMP FOREIGN KEY (employee_id) REFERENCES EMPLOYEES(employee_id),
    CONSTRAINT CHK_PAYROLL_STATUS CHECK (payroll_status IN ('DRAFT', 'PROCESSED', 'PAID'))
);

-- ============================================================================
-- 12. PERFORMANCE_REVIEWS TABLE
-- ============================================================================
CREATE TABLE PERFORMANCE_REVIEWS (
    performance_id NUMBER(10) NOT NULL,
    employee_id NUMBER(10) NOT NULL,
    review_period VARCHAR2(50) NOT NULL,
    goal CLOB NOT NULL,
    achievement CLOB,
    rating NUMBER(2,1),
    feedback CLOB,
    reviewed_by NUMBER(10),
    review_date DATE,
    performance_status VARCHAR2(20) DEFAULT 'DRAFT' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    CONSTRAINT PK_PERFORMANCE_REVIEWS PRIMARY KEY (performance_id),
    CONSTRAINT FK_PERF_EMP FOREIGN KEY (employee_id) REFERENCES EMPLOYEES(employee_id),
    CONSTRAINT FK_PERF_REVIEWER FOREIGN KEY (reviewed_by) REFERENCES EMPLOYEES(employee_id),
    CONSTRAINT CHK_PERF_RATING CHECK (rating IS NULL OR (rating >= 1.0 AND rating <= 5.0)),
    CONSTRAINT CHK_PERF_STATUS CHECK (performance_status IN ('DRAFT', 'SUBMITTED', 'REVIEWED', 'ACKNOWLEDGED'))
);

-- ============================================================================
-- 13. INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IDX_USERS_ROLE ON USERS(role_id);
CREATE INDEX IDX_EMP_DEPT ON EMPLOYEES(department_id);
CREATE INDEX IDX_EMP_MANAGER ON EMPLOYEES(manager_id);
CREATE INDEX IDX_EMP_STATUS ON EMPLOYEES(status);
CREATE INDEX IDX_JOBS_DEPT ON JOBS(department_id);
CREATE INDEX IDX_CAND_JOB ON CANDIDATES(job_id);
CREATE INDEX IDX_ATT_EMP ON ATTENDANCE(employee_id);
CREATE INDEX IDX_ATT_DATE ON ATTENDANCE(attendance_date);
CREATE INDEX IDX_LEAVE_EMP ON LEAVE_REQUESTS(employee_id);
CREATE INDEX IDX_LEAVE_STATUS ON LEAVE_REQUESTS(leave_status);
CREATE INDEX IDX_PAYROLL_EMP ON PAYROLL(employee_id);
CREATE INDEX IDX_PAYROLL_MONTH ON PAYROLL(payroll_month);
CREATE INDEX IDX_PERF_EMP ON PERFORMANCE_REVIEWS(employee_id);

COMMIT;
