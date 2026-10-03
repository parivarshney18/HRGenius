# HRGenius Enterprise HRMS Backend

Production-ready Spring Boot 3 REST API backend powering the **HRGenius** Human Resource Management System. Designed with modular layered architecture, JWT stateless authentication, role-based access control (RBAC), automatic database seeding, dual-mode response formatting for Angular frontend compatibility, and seamless dual-database support for H2 in-memory and Oracle Enterprise Database.

---

## 🛠️ Technology Stack

- **Java**: Java 17 / 21 LTS
- **Framework**: Spring Boot 3.3.4
- **Security**: Spring Security 6 with stateless JWT Bearer tokens and BCrypt password encryption
- **Data Persistence**: Spring Data JPA, Hibernate ORM
- **Databases**:
  - **MySQL 8.0+** (Default Profile): Enterprise relational database using `mysql-connector-j` driver, auto DDL update, and environment variable configuration (`DB_USER`, `DB_PASSWORD`, and optional `DB_URL`)
  - **H2 Database** (`h2` Profile): In-memory database with web console for lightweight testing without MySQL
- **Documentation**: SpringDoc OpenAPI 3 / Swagger UI (`http://localhost:8080/swagger-ui.html`)
- **JSON Serialization**: Jackson with global `SNAKE_CASE` property naming strategy matching Angular frontend models
- **Utilities**: Project Lombok, Jakarta Validation API, Apache Commons, OpenPDF

---

## 🚀 How to Run the Backend

### Prerequisites
- JDK 17 or higher installed (`java -version`)
- MySQL 8.0+ running on `localhost:3306` with database `hrgenius`
- Maven Wrapper is included in the project directory (`mvnw.cmd` on Windows, `./mvnw` on Linux/macOS)

### 1. MySQL Setup (Default Profile)
1. Ensure the `hrgenius` database exists in MySQL:
   ```sql
   CREATE DATABASE IF NOT EXISTS hrgenius DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Set the environment variables for your MySQL credentials:
   - **Windows (PowerShell):**
     ```powershell
     $env:DB_USER = "root"
     $env:DB_PASSWORD = "your_mysql_password"
     ```
   - **Windows (CMD):**
     ```cmd
     set DB_USER=root
     set DB_PASSWORD=your_mysql_password
     ```
   - **Linux / macOS (Bash/Zsh):**
     ```bash
     export DB_USER=root
     export DB_PASSWORD=your_mysql_password
     ```
3. Start the backend:
   ```powershell
   cd C:\Users\Asus\OneDrive\Desktop\HRGenius\hrgenius-backend
   .\mvnw.cmd spring-boot:run
   ```
4. The server will start on port **8080**.
   - Hibernate automatically applies schema updates (`spring.jpa.hibernate.ddl-auto=update`).
   - The DDL reference schema is also available at [`database/schema.sql`](file:///C:/Users/Asus/OneDrive/Desktop/HRGenius/hrgenius-backend/database/schema.sql).
   - `DatabaseSeeder` automatically populates realistic demo records (8 departments, 70 employees, 70 users, 55 jobs, 75 candidates, 50 onboarding cases, 80 attendance records, 65 leaves, 75 payroll entries, and 60 performance reviews) on the first start, and safely skips execution if data is already present.

### 2. Optional: Run with H2 In-Memory Profile
If you wish to test without a running MySQL instance:
```powershell
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=h2
```
H2 console will be accessible at `http://localhost:8080/h2-console` (`jdbc:h2:mem:hrgeniusdb`).

### 3. Build Executable JAR
```powershell
.\mvnw.cmd clean package -DskipTests
java -jar target/hrgenius-backend-1.0.0-SNAPSHOT.jar
```

### 4. Build and Run with Docker
From the backend directory, build and run the image locally with the H2 profile:
```powershell
docker build -t hrgenius-backend .
docker run --rm -p 8080:8080 -e PORT=8080 -e SPRING_PROFILES_ACTIVE=h2 hrgenius-backend
```
The API will be available at `http://localhost:8080`. H2 is in-memory, so its data is lost when the container stops.

### 5. Deploy the Backend to Render
The backend includes a standard [`Dockerfile`](Dockerfile) for Render's Docker web services.

1. In the Render Dashboard, create a **New Web Service** and connect this Git repository.
2. Set **Root Directory** to `hrgenius-backend`. Render will find `Dockerfile` there and build the image.
3. Add the environment variables below in the service settings. Render sets `PORT` automatically; the app reads it.
4. Create the service and wait for the first deploy to finish. The public API URL is shown in the Render Dashboard.

| Variable | Required | Value |
|----------|----------|-------|
| `DB_URL` | Yes | JDBC URL for a reachable, persistent MySQL database, e.g. `jdbc:mysql://<host>:3306/hrgenius?useSSL=true&serverTimezone=UTC` |
| `DB_USER` | Yes | Database username |
| `DB_PASSWORD` | Yes | Database password |
| `JWT_SECRET` | Yes | A private, random secret (at least 32 bytes); do not use the development default |
| `CORS_ALLOWED_ORIGINS` | Yes | Exact origin(s) of the deployed frontend, comma-separated |
| `FRONTEND_URL` | Recommended | Deployed frontend URL, used in links in the application |
| `GOOGLE_CLIENT_ID` | If using Google login | Google OAuth client ID |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD` | If using email | SMTP server and credentials |

Use a persistent external MySQL service: Render's managed database offering is PostgreSQL, which is not compatible with this backend's MySQL driver/configuration. Ensure the database allows connections from Render. Do not activate the H2 profile in production because its data is ephemeral. Redeploy after changing environment variables. Swagger UI is at `<your-render-service-url>/swagger-ui.html`.

### 6. Deploy the Backend to Vercel
Vercel's [container-image support](https://vercel.com/docs/functions/container-images) (currently Beta) runs OCI images as Vercel Functions. For this repository, create a separate Vercel project for the backend and set its **Root Directory** to `hrgenius-backend`; Vercel will detect `Dockerfile.vercel`. The frontend can remain a separate Vercel project.

Configure these environment variables in the Vercel project for **Production**, **Preview**, and **Development** as appropriate:

| Variable | Required | Value |
|----------|----------|-------|
| `PORT` | Yes | `8080` (the port exposed by the Spring Boot app) |
| `DB_URL` | Yes | JDBC URL for a reachable, managed MySQL database, e.g. `jdbc:mysql://<host>:3306/hrgenius?useSSL=true&serverTimezone=UTC` |
| `DB_USER` | Yes | Database username |
| `DB_PASSWORD` | Yes | Database password |
| `JWT_SECRET` | Yes | A private, random secret (at least 32 bytes); do not use the development default |
| `CORS_ALLOWED_ORIGINS` | Yes | Exact origin(s) of the deployed frontend, comma-separated |
| `FRONTEND_URL` | Recommended | Deployed frontend URL, used in links in the application |
| `GOOGLE_CLIENT_ID` | If using Google login | Google OAuth client ID |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD` | If using email | SMTP server and credentials |

Use a persistent external MySQL service; do not use the H2 profile for production because Vercel instances are ephemeral and may scale down. Ensure the database allows connections from the deployment. Set `PORT=8080` so Vercel routes traffic to the port Spring Boot listens on, then redeploy after setting variables. The API is then available at the Vercel project URL, with Swagger UI at `/swagger-ui.html`.

---

## 🔑 Default User Credentials

All seed accounts are initialized with password: **`123456`**

| Username   | Password | Role       | Linked Employee | Full Name     | Designation                     | Department                 |
|------------|----------|------------|-----------------|---------------|---------------------------------|----------------------------|
| `admin`    | `123456` | `ADMIN`    | EMP001          | Aarav Sharma  | VP of Engineering & Technology  | Engineering                |
| `hr`       | `123456` | `HR`       | EMP002          | Priya Patel   | Head of Human Resources         | Human Resources            |
| `manager`  | `123456` | `MANAGER`  | EMP003          | Rajesh Kumar  | Engineering Manager             | Engineering                |
| `employee` | `123456` | `EMPLOYEE` | EMP004          | Ananya Iyer   | Senior Software Engineer        | Engineering                |

---

## 🌐 Quick Access URLs

| Application / Tool | URL | Description |
|--------------------|-----|-------------|
| **Swagger UI** | [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html) | Interactive OpenAPI 3 exploration and testing |
| **OpenAPI Docs** | [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs) | Raw OpenAPI JSON definition |
| **Frontend App** | [http://localhost:4200](http://localhost:4200) | Angular 18 Client Application |

---

## 📚 Complete API Endpoint Catalog

All endpoints return JSON responses with field names formatted in **`snake_case`**.

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/auth/login` | Public | Authenticate with username & password; returns `{ token, username, role }` |
| `POST` | `/api/auth/register` | `ADMIN`, `HR` | Register new user account |
| `GET`  | `/api/auth/me` | Authenticated | Retrieve current user profile and role details |

---

### 1. 🏢 Department Management (`/api/departments`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET`    | `/api/departments` | `ADMIN`, `HR`, `MANAGER`, `EMPLOYEE` | List departments (direct array or paginated if `page` supplied) |
| `GET`    | `/api/departments/{id}` | `ADMIN`, `HR`, `MANAGER`, `EMPLOYEE` | Get department details by ID |
| `POST`   | `/api/departments` | `ADMIN`, `HR` | Create department (`department_name`, `description`, `department_head`, `status`) |
| `PUT`    | `/api/departments/{id}` | `ADMIN`, `HR` | Update department details |
| `DELETE` | `/api/departments/{id}` | `ADMIN` | Delete department (returns 204 No Content) |

---

### 2. 👥 Employee Management (`/api/employees`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET`    | `/api/employees` | `ADMIN`, `HR`, `MANAGER`, `EMPLOYEE` | List employees with filters (`department_id`, `status`, `search`) |
| `GET`    | `/api/employees/{id}` | Authenticated | Get full employee profile by ID |
| `GET`    | `/api/employees/department/{deptId}` | Authenticated | Get employees belonging to department |
| `POST`   | `/api/employees` | `ADMIN`, `HR` | Add new employee with auto-generated code and user credentials |
| `PUT`    | `/api/employees/{id}` | `ADMIN`, `HR` | Update employee information |
| `DELETE` | `/api/employees/{id}` | `ADMIN` | Deactivate/delete employee (returns 204 No Content) |

---

### 3. 🎯 Recruitment & Candidates (`/api/jobs`, `/api/candidates`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET`    | `/api/jobs` | Authenticated | List job postings with department filtering |
| `GET`    | `/api/jobs/{id}` | Authenticated | Get job opening by ID |
| `POST`   | `/api/jobs` | `ADMIN`, `HR` | Post new job opening (`job_title`, `openings`, `description`, `requirements`) |
| `PUT`    | `/api/jobs/{id}` | `ADMIN`, `HR` | Edit job posting details |
| `DELETE` | `/api/jobs/{id}` | `ADMIN`, `HR` | Delete job opening |
| `GET`    | `/api/candidates` | `ADMIN`, `HR` | List candidates with filters (`job_id`, `application_status`, `search`) |
| `GET`    | `/api/candidates/{id}` | `ADMIN`, `HR` | Get candidate details by ID |
| `POST`   | `/api/candidates` | `ADMIN`, `HR` | Add applicant to a job posting |
| `PUT`    | `/api/candidates/{id}` | `ADMIN`, `HR` | Update candidate details |
| `PATCH`  | `/api/candidates/{id}/status` | `ADMIN`, `HR` | Update status (`Applied`, `Shortlisted`, `Interviewed`, `Selected`, `Rejected`) |
| `DELETE` | `/api/candidates/{id}` | `ADMIN`, `HR` | Delete candidate application |

---

### 4. 🚀 Employee Onboarding (`/api/onboarding`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET`  | `/api/onboarding` | `ADMIN`, `HR` | List onboarding workflows with verification & document status |
| `GET`  | `/api/onboarding/{id}` | `ADMIN`, `HR` | Get onboarding record by ID |
| `POST` | `/api/onboarding` | `ADMIN`, `HR` | Initiate candidate onboarding process |
| `PUT`  | `/api/onboarding/{id}` | `ADMIN`, `HR` | Update onboarding checklist & verification statuses |
| `POST` | `/api/onboarding/{id}/complete` | `ADMIN`, `HR` | **Complete Onboarding**: Creates Employee record & User login automatically |
| `POST` | `/api/onboarding/complete` | `ADMIN`, `HR` | Complete onboarding by candidate payload |

---

### 5. ⏰ Attendance Tracking (`/api/attendance`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/attendance/check-in` | Authenticated | Employee clock-in with remarks (auto-detects `Late` vs `Present`) |
| `POST` | `/api/attendance/check-out` | Authenticated | Employee clock-out (auto-calculates `working_hours` & `Half-day` status) |
| `GET`  | `/api/attendance/my` | Authenticated | Get current authenticated employee's attendance logs |
| `GET`  | `/api/attendance/team` | `MANAGER`, `ADMIN`, `HR` | Get attendance logs for direct reports |
| `GET`  | `/api/attendance` | `ADMIN`, `HR` | All attendance logs with date range and employee filters |
| `GET`  | `/api/attendance/employee/{id}` | Authenticated | Get attendance records for specific employee |
| `GET`  | `/api/attendance/today/{id}` | Authenticated | Check today's attendance record for an employee |

---

### 6. 🌴 Leave Management (`/api/leaves`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST`   | `/api/leaves` | Authenticated | Submit leave request (auto-calculates `number_of_days`, rejects collisions) |
| `GET`    | `/api/leaves/my` | Authenticated | View current employee's leave applications & status chips |
| `GET`    | `/api/leaves/pending` | `MANAGER`, `HR`, `ADMIN`| View all pending requests awaiting review |
| `GET`    | `/api/leaves` | `ADMIN`, `HR`, `MANAGER` | Filter all leave applications |
| `PUT`    | `/api/leaves/{id}/approve` | `MANAGER`, `HR`, `ADMIN`| Approve leave (records `approved_by` & `approval_date`) |
| `PUT`    | `/api/leaves/{id}/reject` | `MANAGER`, `HR`, `ADMIN`| Reject leave application |
| `DELETE` | `/api/leaves/{id}` | Authenticated | Cancel pending leave application |

---

### 7. 💵 Payroll Administration (`/api/payroll`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET`  | `/api/payroll/my` | Authenticated | View personal payslips (employee self-service) |
| `GET`  | `/api/payroll` | `ADMIN`, `HR` | List all payroll records filtered by month & status |
| `GET`  | `/api/payroll/{id}` | Authenticated | Get detailed payslip breakdown (Gross, Tax, Deductions, Net) |
| `POST` | `/api/payroll/generate` | `ADMIN`, `HR` | Generate payroll for one employee (`gross = basic + allowances + bonus`, `net = gross - deductions - tax`) |
| `POST` | `/api/payroll/generate-all` | `ADMIN`, `HR` | Batch generate payroll for all active employees for given month |
| `PUT`  | `/api/payroll/{id}/status` | `ADMIN`, `HR` | Update status (`Draft`, `Processed`, `Paid`) |

---

### 8. 📈 Performance & Appraisals (`/api/performance`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET`    | `/api/performance/my` | Authenticated | View personal performance goals, reviews, and ratings |
| `GET`    | `/api/performance/employee/{id}` | Authenticated | View reviews for specific employee |
| `GET`    | `/api/performance/manager/{id}` | `MANAGER`, `ADMIN`, `HR` | View reviews for manager's direct reports |
| `GET`    | `/api/performance` | `HR`, `ADMIN` | View company-wide performance appraisals |
| `POST`   | `/api/performance` | `MANAGER`, `ADMIN`, `HR`, `EMPLOYEE` | Create quarterly goal or self-assessment |
| `PUT`    | `/api/performance/{id}/review` | `MANAGER`, `ADMIN`, `HR` | Submit review feedback & rating (1 to 5 stars) |
| `PUT`    | `/api/performance/{id}` | Authenticated | Update performance record |
| `DELETE` | `/api/performance/{id}` | `ADMIN`, `HR` | Delete appraisal record |

---

### 9. 📊 Dashboard & Reports (`/api/dashboard`, `/api/analytics`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/dashboard/stats` | Authenticated | Aggregated KPI counts & chart datasets (`total_employees`, `new_hires`, `open_positions`, `pending_leaves`, `department_wise_headcount`, `attendance_summary`, `leave_summary`, `recruitment_funnel`, `payroll_summary`, `rating_distribution`) |
| `GET` | `/api/dashboard` | Authenticated | Alias for `/api/dashboard/stats` |
| `GET` | `/api/analytics/export/csv` | `ADMIN`, `HR` | Export system datasets as downloadable CSV (`employees`, `payroll`) |
| `GET` | `/api/analytics/export/pdf` | `ADMIN`, `HR` | Export PDF workforce analytics summary report |

---

### 10. 👤 User Profile (`/api/profile`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/profile/me` | Authenticated | Logged-in employee's personal details, employment details, and complete salary history |
| `GET` | `/api/profile` | Authenticated | Alias for `/api/profile/me` |
| `GET` | `/api/profile/{employeeId}` | Authenticated | View employee profile by ID (Admin, HR, or own profile) |

---

## 📂 Project Directory Structure

```
C:\Users\Asus\OneDrive\Desktop\HRGenius\hrgenius-backend
├── pom.xml
├── mvnw.cmd / mvnw
├── README.md
└── src
    ├── main
    │   ├── java
    │   │   └── com
    │   │       └── hrgenius
    │   │           ├── HrGeniusApplication.java
    │   │           ├── config           # SecurityConfig, CorsConfig, DatabaseSeeder, OpenApiConfig
    │   │           ├── controller       # REST Controllers for all 10 modules
    │   │           ├── dto              # Data Transfer Objects with validation annotations
    │   │           │   ├── analytics
    │   │           │   ├── attendance
    │   │           │   ├── auth
    │   │           │   ├── common
    │   │           │   ├── dashboard
    │   │           │   ├── department
    │   │           │   ├── employee
    │   │           │   ├── leave
    │   │           │   ├── onboarding
    │   │           │   ├── payroll
    │   │           │   ├── performance
    │   │           │   ├── profile
    │   │           │   └── recruitment
    │   │           ├── entity           # JPA Entities mapped to database tables
    │   │           ├── exception        # GlobalExceptionHandler & custom exception classes
    │   │           ├── mapper           # EntityMapper mapping entities to/from DTOs
    │   │           ├── repository       # Spring Data JPA Repository interfaces
    │   │           ├── security         # JWT token provider, filter, UserDetails, SecurityUtils
    │   │           └── service          # Service interfaces and implementations
    │   │               └── impl
    │   └── resources
    │       ├── application.yml          # Default configuration (H2, port 8080, CORS, JWT, snake_case)
    │       └── application-oracle.yml   # Oracle profile configuration with DB_URL, DB_USER, DB_PASSWORD
    └── test
```

---

## 🔒 Security & CORS

- **CORS Support**: Preconfigured in [`CorsConfig.java`](src/main/java/com/hrgenius/config/CorsConfig.java) allowing requests from `http://localhost:4200` and `http://127.0.0.1:4200`.
- **JWT Header**: Pass token in request header: `Authorization: Bearer <token>`.
- **Stateless Sessions**: Sessions are completely stateless (`SessionCreationPolicy.STATELESS`).
