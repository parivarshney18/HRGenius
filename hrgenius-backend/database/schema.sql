-- =============================================================================
-- HRGenius - Enterprise Human Resource Management System
-- Database Schema Definition (MySQL 8.0+)
-- Database: hrgenius
-- Character Set: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `hrgenius`
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE `hrgenius`;

-- -----------------------------------------------------------------------------
-- 1. ROLES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ROLES` (
    `role_id` BIGINT NOT NULL AUTO_INCREMENT,
    `role_name` VARCHAR(50) NOT NULL,
    `description` VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (`role_id`),
    UNIQUE KEY `uk_roles_name` (`role_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. USERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `USERS` (
    `user_id` BIGINT NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role_id` BIGINT NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    `last_login` DATETIME DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id`),
    UNIQUE KEY `uk_users_username` (`username`),
    UNIQUE KEY `uk_users_email` (`email`),
    KEY `idx_users_role_id` (`role_id`),
    CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `ROLES` (`role_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. DEPARTMENTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `DEPARTMENTS` (
    `department_id` BIGINT NOT NULL AUTO_INCREMENT,
    `department_name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(500) DEFAULT NULL,
    `department_head` VARCHAR(100) DEFAULT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`department_id`),
    UNIQUE KEY `uk_departments_name` (`department_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. EMPLOYEES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `EMPLOYEES` (
    `employee_id` BIGINT NOT NULL AUTO_INCREMENT,
    `employee_code` VARCHAR(50) NOT NULL,
    `user_id` BIGINT DEFAULT NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `date_of_birth` DATE NOT NULL,
    `gender` VARCHAR(20) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(30) DEFAULT NULL,
    `address` VARCHAR(500) DEFAULT NULL,
    `date_of_joining` DATE NOT NULL,
    `department_id` BIGINT NOT NULL,
    `manager_id` BIGINT DEFAULT NULL,
    `designation` VARCHAR(100) NOT NULL,
    `employment_type` VARCHAR(50) NOT NULL DEFAULT 'FULL_TIME',
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`employee_id`),
    UNIQUE KEY `uk_employees_code` (`employee_code`),
    UNIQUE KEY `uk_employees_email` (`email`),
    UNIQUE KEY `uk_employees_user_id` (`user_id`),
    KEY `idx_employees_dept_id` (`department_id`),
    KEY `idx_employees_manager_id` (`manager_id`),
    CONSTRAINT `fk_employees_user` FOREIGN KEY (`user_id`) REFERENCES `USERS` (`user_id`) ON DELETE SET NULL,
    CONSTRAINT `fk_employees_department` FOREIGN KEY (`department_id`) REFERENCES `DEPARTMENTS` (`department_id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_employees_manager` FOREIGN KEY (`manager_id`) REFERENCES `EMPLOYEES` (`employee_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. JOBS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `JOBS` (
    `job_id` BIGINT NOT NULL AUTO_INCREMENT,
    `job_title` VARCHAR(150) NOT NULL,
    `department_id` BIGINT NOT NULL,
    `description` TEXT,
    `requirements` TEXT,
    `openings` INT NOT NULL DEFAULT 1,
    `posting_date` DATE NOT NULL,
    `closing_date` DATE DEFAULT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`job_id`),
    KEY `idx_jobs_department_id` (`department_id`),
    CONSTRAINT `fk_jobs_department` FOREIGN KEY (`department_id`) REFERENCES `DEPARTMENTS` (`department_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. CANDIDATES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `CANDIDATES` (
    `candidate_id` BIGINT NOT NULL AUTO_INCREMENT,
    `job_id` BIGINT NOT NULL,
    `candidate_name` VARCHAR(150) NOT NULL,
    `candidate_email` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(30) DEFAULT NULL,
    `resume_url` VARCHAR(500) DEFAULT NULL,
    `application_date` DATE NOT NULL,
    `application_status` VARCHAR(30) NOT NULL DEFAULT 'APPLIED',
    `interview_date` DATETIME DEFAULT NULL,
    `interview_result` VARCHAR(500) DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`candidate_id`),
    KEY `idx_candidates_job_id` (`job_id`),
    CONSTRAINT `fk_candidates_job` FOREIGN KEY (`job_id`) REFERENCES `JOBS` (`job_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. ONBOARDING
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ONBOARDING` (
    `onboarding_id` BIGINT NOT NULL AUTO_INCREMENT,
    `candidate_id` BIGINT NOT NULL,
    `employee_id` BIGINT DEFAULT NULL,
    `joining_date` DATE NOT NULL,
    `document_status` VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    `verification_status` VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    `assigned_department` BIGINT NOT NULL,
    `assigned_manager` BIGINT DEFAULT NULL,
    `onboarding_status` VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`onboarding_id`),
    UNIQUE KEY `uk_onboarding_candidate_id` (`candidate_id`),
    UNIQUE KEY `uk_onboarding_employee_id` (`employee_id`),
    KEY `idx_onboarding_dept_id` (`assigned_department`),
    KEY `idx_onboarding_manager_id` (`assigned_manager`),
    CONSTRAINT `fk_onboarding_candidate` FOREIGN KEY (`candidate_id`) REFERENCES `CANDIDATES` (`candidate_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_onboarding_employee` FOREIGN KEY (`employee_id`) REFERENCES `EMPLOYEES` (`employee_id`) ON DELETE SET NULL,
    CONSTRAINT `fk_onboarding_dept` FOREIGN KEY (`assigned_department`) REFERENCES `DEPARTMENTS` (`department_id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_onboarding_manager` FOREIGN KEY (`assigned_manager`) REFERENCES `EMPLOYEES` (`employee_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. ATTENDANCE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ATTENDANCE` (
    `attendance_id` BIGINT NOT NULL AUTO_INCREMENT,
    `employee_id` BIGINT NOT NULL,
    `attendance_date` DATE NOT NULL,
    `check_in` DATETIME DEFAULT NULL,
    `check_out` DATETIME DEFAULT NULL,
    `attendance_status` VARCHAR(20) NOT NULL DEFAULT 'PRESENT',
    `working_hours` DOUBLE DEFAULT 0.0,
    `remarks` VARCHAR(255) DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`attendance_id`),
    UNIQUE KEY `UK_ATTENDANCE_EMP_DATE` (`employee_id`, `attendance_date`),
    KEY `idx_attendance_employee_id` (`employee_id`),
    CONSTRAINT `fk_attendance_employee` FOREIGN KEY (`employee_id`) REFERENCES `EMPLOYEES` (`employee_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. LEAVE_REQUESTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `LEAVE_REQUESTS` (
    `leave_id` BIGINT NOT NULL AUTO_INCREMENT,
    `employee_id` BIGINT NOT NULL,
    `leave_type` VARCHAR(30) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `number_of_days` DOUBLE NOT NULL,
    `reason` VARCHAR(500) NOT NULL,
    `applied_date` DATE NOT NULL,
    `approved_by` BIGINT DEFAULT NULL,
    `approval_date` DATE DEFAULT NULL,
    `leave_status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`leave_id`),
    KEY `idx_leaves_employee_id` (`employee_id`),
    KEY `idx_leaves_approved_by` (`approved_by`),
    CONSTRAINT `fk_leave_employee` FOREIGN KEY (`employee_id`) REFERENCES `EMPLOYEES` (`employee_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_leave_approver` FOREIGN KEY (`approved_by`) REFERENCES `EMPLOYEES` (`employee_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 10. PAYROLL
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `PAYROLL` (
    `payroll_id` BIGINT NOT NULL AUTO_INCREMENT,
    `employee_id` BIGINT NOT NULL,
    `payroll_month` VARCHAR(7) NOT NULL,
    `basic_salary` DECIMAL(12, 2) NOT NULL,
    `allowances` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `bonus` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `deductions` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `tax` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `gross_salary` DECIMAL(12, 2) NOT NULL,
    `net_salary` DECIMAL(12, 2) NOT NULL,
    `payment_date` DATE DEFAULT NULL,
    `payroll_status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`payroll_id`),
    UNIQUE KEY `UK_PAYROLL_EMP_MONTH` (`employee_id`, `payroll_month`),
    KEY `idx_payroll_employee_id` (`employee_id`),
    CONSTRAINT `fk_payroll_employee` FOREIGN KEY (`employee_id`) REFERENCES `EMPLOYEES` (`employee_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 11. PERFORMANCE_REVIEWS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `PERFORMANCE_REVIEWS` (
    `performance_id` BIGINT NOT NULL AUTO_INCREMENT,
    `employee_id` BIGINT NOT NULL,
    `review_period` VARCHAR(50) NOT NULL,
    `goal` TEXT NOT NULL,
    `achievement` TEXT,
    `rating` DOUBLE DEFAULT NULL,
    `feedback` TEXT,
    `reviewed_by` BIGINT DEFAULT NULL,
    `review_date` DATE DEFAULT NULL,
    `performance_status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`performance_id`),
    KEY `idx_perf_employee_id` (`employee_id`),
    KEY `idx_perf_reviewed_by` (`reviewed_by`),
    CONSTRAINT `fk_perf_employee` FOREIGN KEY (`employee_id`) REFERENCES `EMPLOYEES` (`employee_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_perf_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `EMPLOYEES` (`employee_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 12. PASSWORD_RESET_TOKENS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `PASSWORD_RESET_TOKENS` (
    `token_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `token_hash` VARCHAR(64) NOT NULL,
    `expires_at` DATETIME NOT NULL,
    `used` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`token_id`),
    KEY `idx_pwd_reset_token_hash` (`token_hash`),
    KEY `idx_pwd_reset_user_id` (`user_id`),
    CONSTRAINT `fk_pwd_reset_user` FOREIGN KEY (`user_id`) REFERENCES `USERS` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
