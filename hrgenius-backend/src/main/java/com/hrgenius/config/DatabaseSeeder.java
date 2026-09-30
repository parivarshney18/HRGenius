package com.hrgenius.config;

import com.hrgenius.entity.*;
import com.hrgenius.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;
    private final JobRepository jobRepository;
    private final CandidateRepository candidateRepository;
    private final OnboardingRepository onboardingRepository;
    private final AttendanceRepository attendanceRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final PayrollRepository payrollRepository;
    private final PerformanceReviewRepository performanceReviewRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (employeeRepository.count() > 0) {
            log.info("Database already contains seeded data ({} employees found). Skipping seeder.", employeeRepository.count());
            return;
        }

        log.info("Seeding database with deterministic procedural data (Random seed: 42)...");
        Random random = new Random(42);

        // =========================================================================
        // 1. ROLES (4 Roles)
        // =========================================================================
        Role adminRole = getOrCreateRole("ROLE_ADMIN", "System Administrator with full access");
        Role hrRole = getOrCreateRole("ROLE_HR", "HR Specialist with workforce, payroll, and recruitment access");
        Role managerRole = getOrCreateRole("ROLE_MANAGER", "Team Manager with approval and review authority");
        Role empRole = getOrCreateRole("ROLE_EMPLOYEE", "Employee with self-service access");

        // =========================================================================
        // 2. DEPARTMENTS (8 Departments)
        // =========================================================================
        String[][] deptData = {
                {"Engineering", "Software architecture, cloud infrastructure, development, and QA.", "Aarav Sharma"},
                {"Human Resources", "Talent acquisition, employee welfare, relations, and HR compliance.", "Priya Patel"},
                {"Finance", "Corporate finance, payroll administration, audit, and tax planning.", "Vikram Verma"},
                {"Sales", "Global sales operations, business development, and enterprise partnerships.", "Neha Singh"},
                {"Marketing", "Brand management, digital marketing, demand generation, and PR.", "Rohan Gupta"},
                {"Operations", "Facilities management, vendor contracts, business processes, and logistics.", "Sneha Deshmukh"},
                {"IT Support", "Internal IT helpdesk, network security, hardware assets, and systems support.", "Aditya Reddy"},
                {"Legal", "Contract negotiations, corporate governance, intellectual property, and compliance.", "Pooja Mehta"}
        };

        List<Department> departments = new ArrayList<>();
        for (String[] d : deptData) {
            departments.add(getOrCreateDepartment(d[0], d[1], d[2]));
        }

        // =========================================================================
        // 3. EMPLOYEES & USERS (70 Employees, 70 Users)
        // =========================================================================
        String defaultPasswordHash = passwordEncoder.encode("123456");

        String[] firstNames = {
                "Aarav", "Priya", "Rajesh", "Ananya", "Vikram", "Neha", "Rohan", "Sneha", "Aditya", "Pooja",
                "Arjun", "Kavita", "Sanjay", "Divya", "Rahul", "Ritu", "Amit", "Meera", "Karan", "Swati",
                "Nikhil", "Deepika", "Manish", "Shreya", "Gaurav", "Sunita", "Harsh", "Tanvi", "Siddharth", "Aishwarya",
                "Varun", "Isha", "Ravi", "Anjali", "Kunal", "Simran", "Deepak", "Akanksha", "Prateek", "Bhavna",
                "Mohit", "Geeta", "Abhishek", "Jyoti", "Alok", "Preeti", "Suresh", "Rupal", "Vivek", "Pallavi",
                "Naveen", "Shweta", "Tarun", "Payal", "Ashish", "Komal", "Mayank", "Richa", "Hemant", "Sarita",
                "Sachin", "Archana", "Dinesh", "Rashmi", "Jitendra", "Monika", "Pawan", "Garima", "Bhavesh", "Madhuri"
        };

        String[] lastNames = {
                "Sharma", "Patel", "Kumar", "Iyer", "Verma", "Singh", "Gupta", "Deshmukh", "Reddy", "Mehta",
                "Nair", "Chopra", "Joshi", "Bose", "Malhotra", "Kulkarni", "Agarwal", "Rao", "Bhatia", "Chatterjee",
                "Saxena", "Menon", "Trivedi", "Banerjee", "Kapoor", "Pillai", "Mishra", "Pandey", "Shukla", "Dubey",
                "Bhatt", "Chauhan", "Gokhale", "Bhardwaj", "Sen", "Bhattacharya", "Chakraborty", "Das", "Dutta", "Ghosh",
                "Bahl", "Suri", "Bakshi", "Walia", "Ahluwalia", "Dewan", "Grover", "Tandon", "Khurana", "Luthra",
                "Batra", "Chawla", "Bhandari", "Seth", "Sabharwal", "Dhillon", "Gill", "Sandhu", "Grewal", "Virk",
                "Venkatesh", "Sundaram", "Subramanian", "Ranganathan", "Narayanan", "Krishnan", "Balakrishnan", "Srinivasan", "Raghavan", "Mukherjee"
        };

        String[] genders = {
                "Male", "Female", "Male", "Female", "Male", "Female", "Male", "Female", "Male", "Female",
                "Male", "Female", "Male", "Female", "Male", "Female", "Male", "Female", "Male", "Female",
                "Male", "Female", "Male", "Female", "Male", "Female", "Male", "Female", "Male", "Female",
                "Male", "Female", "Male", "Female", "Male", "Female", "Male", "Female", "Male", "Female",
                "Male", "Female", "Male", "Female", "Male", "Female", "Male", "Female", "Male", "Female",
                "Male", "Female", "Male", "Female", "Male", "Female", "Male", "Female", "Male", "Female",
                "Male", "Female", "Male", "Female", "Male", "Female", "Male", "Female", "Male", "Female"
        };

        String[] cities = {
                "Bengaluru, Karnataka", "Mumbai, Maharashtra", "Pune, Maharashtra", "Hyderabad, Telangana",
                "Gurugram, Haryana", "Chennai, Tamil Nadu", "Noida, Uttar Pradesh", "New Delhi, Delhi",
                "Kolkata, West Bengal", "Ahmedabad, Gujarat", "Jaipur, Rajasthan", "Kochi, Kerala"
        };

        String[][] deptDesignations = {
                // 0: Engineering
                {"VP of Engineering", "Engineering Manager", "Senior Software Engineer", "DevOps Engineer", "Frontend Specialist", "QA Automation Engineer"},
                // 1: Human Resources
                {"Head of Human Resources", "Senior HR Generalist", "Talent Acquisition Lead", "HR Operations Executive", "Employee Relations Specialist"},
                // 2: Finance
                {"Chief Financial Officer", "Senior Financial Analyst", "Accounts Payable Lead", "Tax Compliance Specialist", "Audit Officer"},
                // 3: Sales
                {"VP of Global Sales", "Enterprise Account Executive", "Regional Sales Manager", "Pre-Sales Consultant", "Business Development Executive"},
                // 4: Marketing
                {"Head of Marketing", "Product Marketing Lead", "Digital Marketing Specialist", "Brand Content Strategist", "SEO & Growth Analyst"},
                // 5: Operations
                {"Head of Operations", "Facilities Manager", "Procurement Specialist", "Business Process Lead", "Operations Coordinator"},
                // 6: IT Support
                {"Head of IT Infrastructure", "Senior Systems Administrator", "Network Engineer", "IT Support Specialist", "Information Security Analyst"},
                // 7: Legal
                {"Head of Legal & Compliance", "Corporate Counsel", "Contract Specialist", "Data Privacy Officer", "Regulatory Compliance Analyst"}
        };

        List<Employee> employees = new ArrayList<>();

        for (int i = 0; i < 70; i++) {
            String code = String.format("EMP%03d", i + 1);
            String first = firstNames[i];
            String last = lastNames[i];
            String email = (first + "." + last + (i > 24 ? i : "") + "@hrgenius.com").toLowerCase();
            String phone = String.format("+91 98%03d %05d", 700 + ((i * 7) % 200), 10000 + ((i * 123) % 89999));
            String address = String.format("%d, Brigade Road, %s", 12 + i * 2, cities[i % cities.length]);
            String gender = genders[i];
            LocalDate dob = LocalDate.of(1980 + (i % 20), 1 + (i % 12), 1 + (i % 27));
            LocalDate doj = LocalDate.of(2021 + (i % 5), 1 + ((i * 3) % 12), 1 + ((i * 5) % 27));

            // Employment Type: mostly Full-Time (80%), 10% Part-Time, 10% Contract
            String empType = (i % 10 == 8) ? "Part-Time" : ((i % 10 == 9) ? "Contract" : "Full-Time");
            // Status: mostly Active (94%), a few On Leave/Inactive
            String status = (i == 30 || i == 55) ? "Inactive" : "Active";

            // User account, Role, Department & Manager assignment
            int deptIdx;
            String designation;
            Role userRole;
            String username;
            Employee manager = null;

            if (i == 0) {
                // admin: Engineering VP (EMP001)
                deptIdx = 0; // Engineering
                designation = "VP of Engineering & Technology";
                username = "admin";
                userRole = adminRole;
                manager = null;
            } else if (i == 1) {
                // hr: HR Head (EMP002)
                deptIdx = 1; // Human Resources
                designation = "Head of Human Resources";
                username = "hr";
                userRole = hrRole;
                manager = employees.get(0);
            } else if (i == 2) {
                // manager: Engineering Manager (EMP003)
                deptIdx = 0; // Engineering
                designation = "Engineering Manager";
                username = "manager";
                userRole = managerRole;
                manager = employees.get(0);
            } else if (i == 3) {
                // employee: Senior Software Engineer (EMP004)
                deptIdx = 0; // Engineering
                designation = "Senior Software Engineer";
                username = "employee";
                userRole = empRole;
                manager = employees.get(2); // Reports to Rajesh Kumar (manager)
            } else {
                deptIdx = i % 8;
                String[] desigs = deptDesignations[deptIdx];
                designation = (i < 8) ? desigs[0] : desigs[1 + ((i / 8) % (desigs.length - 1))];
                username = (first.toLowerCase() + (i + 1));
                userRole = (i < 8) ? managerRole : empRole;
                manager = (i < 8) ? employees.get(0) : employees.get(deptIdx);
            }

            Department dept = departments.get(deptIdx);

            User user = userRepository.save(User.builder()
                    .username(username)
                    .email(email)
                    .password(defaultPasswordHash)
                    .role(userRole)
                    .status("ACTIVE")
                    .build());

            Employee employee = employeeRepository.save(Employee.builder()
                    .employeeCode(code)
                    .firstName(first)
                    .lastName(last)
                    .email(email)
                    .phone(phone)
                    .address(address)
                    .gender(gender)
                    .dateOfBirth(dob)
                    .dateOfJoining(doj)
                    .designation(designation)
                    .employmentType(empType)
                    .user(user)
                    .department(dept)
                    .manager(manager)
                    .status(status)
                    .build());

            employees.add(employee);
        }

        // =========================================================================
        // 4. JOBS (55 Job Openings)
        // =========================================================================
        String[] jobTitles = {
                // Human Resources (7)
                "Senior Talent Acquisition Partner", "HR Business Partner", "Compensation & Benefits Specialist",
                "Corporate Learning & Development Manager", "Employee Relations Lead", "HR Operations Executive", "Technical Recruiter",
                // Engineering (8)
                "Senior Java Backend Engineer", "Lead Angular Frontend Developer", "Cloud Solutions Architect",
                "DevOps & SRE Engineer", "Staff Software Engineer (Distributed Systems)", "QA Automation Lead Engineer",
                "Full Stack Engineer (Spring & Angular)", "Mobile Application Engineer (Flutter)",
                // Finance (7)
                "Senior Financial Planning Analyst", "Corporate Tax Manager", "Internal Audit Specialist",
                "Accounts Payable Lead", "Treasury & Risk Manager", "Financial Controller", "Payroll Accounting Specialist",
                // Sales (7)
                "Enterprise Sales Account Executive", "Strategic Partnerships Director", "Pre-Sales Technical Consultant",
                "Inside Sales Representative", "Regional Business Development Manager", "Key Account Executive", "Sales Operations Analyst",
                // Marketing (7)
                "Product Marketing Manager", "Digital Performance Marketer", "Content Marketing Strategist",
                "SEO & Growth Specialist", "Brand & Communications Lead", "Social Media & Community Manager", "Marketing Analytics Specialist",
                // Operations (7)
                "Operations Excellence Manager", "Supply Chain & Procurement Lead", "Facilities & Workplace Specialist",
                "Business Process Optimization Consultant", "Vendor Relations Manager", "Logistics & Fleet Coordinator", "Operational Risk Analyst",
                // IT Support (6)
                "Senior Network Systems Administrator", "IT Infrastructure Support Lead", "Desktop Support Engineer",
                "Cybersecurity Operations Analyst", "IT Helpdesk Specialist", "Cloud Systems Administrator",
                // Legal (6)
                "Corporate Counsel (Commercial Contracts)", "Data Privacy & GDPR Officer", "Legal Operations Manager",
                "Intellectual Property & Trademark Counsel", "Regulatory Compliance Specialist", "Employment Law Counsel"
        };

        List<Job> jobs = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (int j = 0; j < 55; j++) {
            Department dept = departments.get(j % 8);
            String title = jobTitles[j % jobTitles.length];
            int openings = 1 + (j % 3);
            LocalDate postingDate = today.minusDays(10 + (j % 35));
            LocalDate closingDate = today.plusDays(15 + (j % 40));
            String jobStatus = (j % 11 == 0) ? "CLOSED" : "OPEN";

            Job job = jobRepository.save(Job.builder()
                    .jobTitle(title)
                    .department(dept)
                    .description("Lead key initiatives, drive business goals, and collaborate across teams to ensure operational excellence.")
                    .requirements("Bachelor's or Master's degree, 3+ years domain experience, strong problem-solving and cross-functional leadership.")
                    .openings(openings)
                    .postingDate(postingDate)
                    .closingDate(closingDate)
                    .status(jobStatus)
                    .build());

            jobs.add(job);
        }

        // =========================================================================
        // 5. CANDIDATES (75 Candidates)
        // 50 Selected (for the 50 Onboardings), 8 Applied, 6 Shortlisted, 6 Interviewed, 5 Rejected
        // =========================================================================
        String[] candidateFirstNames = {
                "Aditi", "Anil", "Bhavin", "Chetan", "Deepa", "Esha", "Farhan", "Gita", "Harish", "Indira",
                "Jaspreet", "Kiran", "Laxman", "Madhav", "Nandini", "Omkar", "Pankaj", "Qasim", "Rakesh", "Sonal",
                "Tanmay", "Urvashi", "Vinod", "Waseem", "Yash", "Zoya", "Ankur", "Bindu", "Chirag", "Dolly",
                "Eknath", "Falguni", "Girish", "Hema", "Ishaan", "Juhi", "Kamal", "Lalit", "Mona", "Nitin",
                "Ojas", "Parul", "Quresh", "Rohit", "Seema", "Tejas", "Umesh", "Vandana", "Wasim", "Yuvraj",
                "Aman", "Brijesh", "Charu", "Devendra", "Ekta", "Firoz", "Gautam", "Hansha", "Inder", "Jaya",
                "Kishore", "Lata", "Manas", "Nisha", "Om", "Prerna", "Raghav", "Shruti", "Trishna", "Utkarsh",
                "Varsha", "Vidya", "Vijay", "Zakir", "Anand"
        };

        String[] candidateLastNames = {
                "Bose", "Pillai", "Das", "Sen", "Bhatt", "Chauhan", "Dutta", "Ghosh", "Joshi", "Kapoor",
                "Kulkarni", "Menon", "Mishra", "Pandey", "Rao", "Reddy", "Saxena", "Shukla", "Singh", "Verma",
                "Agarwal", "Bhatia", "Chatterjee", "Deshmukh", "Gupta", "Iyer", "Kumar", "Malhotra", "Mehta", "Nair",
                "Patel", "Sharma", "Bahl", "Suri", "Bakshi", "Walia", "Ahluwalia", "Dewan", "Grover", "Tandon",
                "Khurana", "Luthra", "Batra", "Chawla", "Bhandari", "Seth", "Sabharwal", "Dhillon", "Gill", "Sandhu",
                "Grewal", "Virk", "Venkatesh", "Sundaram", "Subramanian", "Ranganathan", "Narayanan", "Krishnan", "Balakrishnan", "Srinivasan",
                "Raghavan", "Mukherjee", "Banerjee", "Trivedi", "Dubey", "Gokhale", "Bhardwaj", "Chakraborty", "Roy", "Mitra",
                "Barman", "Mandal", "Sarkar", "Majumdar", "Biswas"
        };

        List<Candidate> candidates = new ArrayList<>();

        for (int c = 0; c < 75; c++) {
            Job job = jobs.get(c % jobs.size());
            String cFirst = candidateFirstNames[c];
            String cLast = candidateLastNames[c];
            String cName = cFirst + " " + cLast;
            String cEmail = (cFirst + "." + cLast + c + "@candidate.com").toLowerCase();
            String cPhone = String.format("+91 91234 %05d", 50000 + c * 137);
            String resume = "resume_" + cFirst.toLowerCase() + "_" + cLast.toLowerCase() + ".pdf";

            LocalDate appDate = today.minusDays(15 + (c % 25));

            String appStatus;
            LocalDateTime interviewDate = null;
            String interviewResult = null;

            if (c < 50) {
                // 50 Selected Candidates (to feed the 50 Onboarding records)
                appStatus = "Selected";
                interviewDate = LocalDateTime.of(today.minusDays(3 + (c % 10)), LocalTime.of(10 + (c % 6), 0));
                interviewResult = "Selected - Candidate accepted the formal offer letter.";
            } else if (c < 58) {
                // 8 Applied
                appStatus = "Applied";
            } else if (c < 64) {
                // 6 Shortlisted
                appStatus = "Shortlisted";
                interviewDate = LocalDateTime.of(today.plusDays(2 + (c % 7)), LocalTime.of(14, 30));
                interviewResult = "Technical interview scheduled with hiring team.";
            } else if (c < 70) {
                // 6 Interviewed
                appStatus = "Interviewed";
                interviewDate = LocalDateTime.of(today.minusDays(2 + (c % 5)), LocalTime.of(11, 0));
                interviewResult = "Interview completed. Evaluation notes in review.";
            } else {
                // 5 Rejected
                appStatus = "Rejected";
                interviewDate = LocalDateTime.of(today.minusDays(8 + (c % 5)), LocalTime.of(16, 0));
                interviewResult = "Rejected - Lacked required enterprise domain expertise.";
            }

            Candidate candidate = candidateRepository.save(Candidate.builder()
                    .job(job)
                    .candidateName(cName)
                    .candidateEmail(cEmail)
                    .phone(cPhone)
                    .resumeUrl(resume)
                    .applicationDate(appDate)
                    .applicationStatus(appStatus)
                    .interviewDate(interviewDate)
                    .interviewResult(interviewResult)
                    .build());

            candidates.add(candidate);
        }

        // =========================================================================
        // 6. ONBOARDING (50 Records)
        // Linked to the 50 Selected candidates
        // =========================================================================
        List<Onboarding> onboardings = new ArrayList<>();
        for (int o = 0; o < 50; o++) {
            Candidate cand = candidates.get(o);
            Department dept = cand.getJob().getDepartment();
            int deptId = (int) (long) dept.getDepartmentId();
            Employee manager = employees.get(deptId % 8);

            String onbStatus;
            String docStatus;
            String verStatus;
            LocalDate joiningDate;
            Employee createdEmp = null;

            if (o < 15) {
                // 15 Completed
                onbStatus = "Completed";
                docStatus = "Verified";
                verStatus = "Passed";
                joiningDate = today.minusDays(5 + o);
                createdEmp = employees.get(50 + o); // Link to an existing employee record
            } else if (o < 35) {
                // 20 In Progress
                onbStatus = "In Progress";
                docStatus = (o % 2 == 0) ? "Submitted" : "Under Review";
                verStatus = "In Progress";
                joiningDate = today.plusDays(5 + (o % 15));
            } else {
                // 15 Pending
                onbStatus = "Pending";
                docStatus = "Pending";
                verStatus = "Pending";
                joiningDate = today.plusDays(20 + (o % 20));
            }

            Onboarding onboarding = onboardingRepository.save(Onboarding.builder()
                    .candidate(cand)
                    .employee(createdEmp)
                    .joiningDate(joiningDate)
                    .documentStatus(docStatus)
                    .verificationStatus(verStatus)
                    .assignedDepartment(dept)
                    .assignedManager(manager)
                    .onboardingStatus(onbStatus)
                    .build());

            onboardings.add(onboarding);
        }

        // =========================================================================
        // 7. ATTENDANCE (80 Records)
        // Spread over last 30 days across employees, with computed working_hours
        // 50 Present, 12 Late, 10 Half-day, 8 Absent
        // =========================================================================
        List<Attendance> attendances = new ArrayList<>();

        for (int a = 0; a < 80; a++) {
            // Pick an employee and a unique date offset to avoid duplicates
            int empIndex = (a * 7) % 70;
            Employee emp = employees.get(empIndex);
            int dayOffset = (a % 28) + 1; // 1 to 28 days ago
            LocalDate attDate = today.minusDays(dayOffset);

            String attStatus;
            LocalDateTime checkIn = null;
            LocalDateTime checkOut = null;
            Double hours = 0.0;
            String remarks;

            if (a < 50) {
                // 50 Present
                attStatus = "Present";
                checkIn = attDate.atTime(LocalTime.of(8, 45).plusMinutes(a % 20));
                checkOut = attDate.atTime(LocalTime.of(17, 30).plusMinutes(a % 25));
                hours = Math.round((Duration.between(checkIn, checkOut).toMinutes() / 60.0) * 10.0) / 10.0;
                remarks = "On-time arrival, full standard workday completed.";
            } else if (a < 62) {
                // 12 Late
                attStatus = "Late";
                checkIn = attDate.atTime(LocalTime.of(9, 30).plusMinutes(a % 25));
                checkOut = attDate.atTime(LocalTime.of(18, 15).plusMinutes(a % 25));
                hours = Math.round((Duration.between(checkIn, checkOut).toMinutes() / 60.0) * 10.0) / 10.0;
                remarks = "Delayed due to morning traffic congestion.";
            } else if (a < 72) {
                // 10 Half-day
                attStatus = "Half-day";
                checkIn = attDate.atTime(LocalTime.of(9, 0));
                checkOut = attDate.atTime(LocalTime.of(13, 0).plusMinutes(a % 25));
                hours = Math.round((Duration.between(checkIn, checkOut).toMinutes() / 60.0) * 10.0) / 10.0;
                remarks = "First half logged; afternoon personal leave.";
            } else {
                // 8 Absent
                attStatus = "Absent";
                remarks = "Unscheduled absence recorded.";
            }

            Attendance att = attendanceRepository.save(Attendance.builder()
                    .employee(emp)
                    .attendanceDate(attDate)
                    .checkIn(checkIn)
                    .checkOut(checkOut)
                    .workingHours(hours)
                    .attendanceStatus(attStatus)
                    .remarks(remarks)
                    .build());

            attendances.add(att);
        }

        // =========================================================================
        // 8. LEAVES (65 Records)
        // Distinct employees (indices 0 to 64) to strictly avoid overlaps!
        // 35 APPROVED, 20 PENDING, 10 REJECTED
        // =========================================================================
        String[] leaveTypes = {"Annual Leave", "Sick Leave", "Casual Leave", "Maternity Leave", "Paternity Leave"};
        List<LeaveRequest> leaves = new ArrayList<>();

        for (int l = 0; l < 65; l++) {
            Employee emp = employees.get(l); // 1 leave per distinct employee -> zero overlap guaranteed
            String type = leaveTypes[l % leaveTypes.length];
            int numDays = 1 + (l % 5);
            LocalDate start = today.minusDays(15).plusDays((l * 3) % 40);
            LocalDate end = start.plusDays(numDays - 1);
            LocalDate applied = start.minusDays(2 + (l % 7));

            String lStatus;
            Employee approver = null;
            LocalDate approvalDate = null;

            if (l < 35) {
                lStatus = "APPROVED";
                approver = emp.getManager() != null ? emp.getManager() : employees.get(0);
                approvalDate = applied.plusDays(1);
            } else if (l < 55) {
                lStatus = "PENDING";
            } else {
                lStatus = "REJECTED";
                approver = emp.getManager() != null ? emp.getManager() : employees.get(0);
                approvalDate = applied.plusDays(1);
            }

            LeaveRequest leave = leaveRequestRepository.save(LeaveRequest.builder()
                    .employee(emp)
                    .leaveType(type)
                    .startDate(start)
                    .endDate(end)
                    .numberOfDays((double) numDays)
                    .reason("Family event / personal wellness requirement.")
                    .appliedDate(applied)
                    .leaveStatus(lStatus)
                    .approvedBy(approver)
                    .approvalDate(approvalDate)
                    .build());

            leaves.add(leave);
        }

        // =========================================================================
        // 9. PAYROLL (75 Records)
        // 25 employees across 3 months (2026-07, 2026-08, 2026-09)
        // gross = basic + allowances + bonus, net = gross - deductions - tax
        // =========================================================================
        String[] months = {"2026-07", "2026-08", "2026-09"};
        List<Payroll> payrolls = new ArrayList<>();

        for (int m = 0; m < 3; m++) {
            String month = months[m];
            LocalDate payDate = LocalDate.of(2026, 7 + m, (m == 0 ? 31 : (m == 1 ? 31 : 30)));

            for (int p = 0; p < 25; p++) {
                Employee emp = employees.get(p);

                BigDecimal basic = BigDecimal.valueOf(50000 + (p * 2000));
                BigDecimal allowances = BigDecimal.valueOf(10000 + (p * 500));
                BigDecimal bonus = BigDecimal.valueOf((p % 3 == 0) ? 5000 : 0);
                BigDecimal deductions = BigDecimal.valueOf(4000 + (p * 150));
                BigDecimal tax = BigDecimal.valueOf(5000 + (p * 300));

                BigDecimal gross = basic.add(allowances).add(bonus);
                BigDecimal net = gross.subtract(deductions).subtract(tax);

                String pStatus;
                LocalDate effectivePayDate = null;

                if (m < 2) {
                    // July and August: all Paid (50 Paid)
                    pStatus = "Paid";
                    effectivePayDate = payDate;
                } else {
                    // September: 10 Paid, 8 Processed, 7 Draft
                    if (p < 10) {
                        pStatus = "Paid";
                        effectivePayDate = payDate;
                    } else if (p < 18) {
                        pStatus = "Processed";
                    } else {
                        pStatus = "Draft";
                    }
                }

                Payroll payroll = payrollRepository.save(Payroll.builder()
                        .employee(emp)
                        .payrollMonth(month)
                        .basicSalary(basic)
                        .allowances(allowances)
                        .bonus(bonus)
                        .deductions(deductions)
                        .tax(tax)
                        .grossSalary(gross)
                        .netSalary(net)
                        .payrollStatus(pStatus)
                        .paymentDate(effectivePayDate)
                        .build());

                payrolls.add(payroll);
            }
        }

        // =========================================================================
        // 10. PERFORMANCE (60 Records)
        // 60 distinct employees (indices 5 to 64), ratings 1 to 5, different periods
        // =========================================================================
        String[] reviewPeriods = {"Q1 2026", "Q2 2026", "Q3 2026"};
        String[] goals = {
                "Deliver real-time telemetry dashboard with sub-50ms latency",
                "Streamline candidate onboarding and turnaround compliance under 5 business days",
                "Automate database failover rehearsal and maintain 99.99% service uptime",
                "Exceed quarterly enterprise ARR sales targets by at least 15%",
                "Revamp customer support knowledge base and raise first-response CSAT to 95%",
                "Formulate comprehensive data protection audit adhering strictly to GDPR",
                "Implement reactive state management and unit testing coverage above 90%",
                "Architect vendor evaluation scorecard and reduce IT hardware procurement cycle by 20%"
        };
        String[] achievements = {
                "Engineered scalable data streaming pipeline with zero production defect count.",
                "Completed candidate credential verification with 100% audit accuracy.",
                "Simulated cluster disaster recovery drills successfully with no data corruption.",
                "Secured 8 key enterprise contract renewals and surpassed quarterly quota.",
                "Resolution turnaround improved by 35% across high-priority helpdesk tickets.",
                "Conducted enterprise-wide risk analysis and closed all high-severity compliance gaps.",
                "Migrated core components to standalone architecture with 94% code coverage.",
                "Standardized vendor RFP workflows and trimmed operational turnaround by 25%."
        };
        String[] feedbacks = {
                "Exceptional leadership, proactive technical delivery, and stellar domain ownership.",
                "Strong analytical rigor and consistent follow-through across cross-functional tasks.",
                "Outstanding contribution to platform reliability, engineering agility, and culture.",
                "Consistently exceeds delivery expectations while mentoring junior team members.",
                "Great attention to detail and reliable execution under demanding timelines."
        };

        Double[] ratingDist = {5.0, 4.0, 4.0, 5.0, 3.0, 4.0, 5.0, 4.0, 3.0, 2.0, 5.0, 4.0};

        List<PerformanceReview> reviews = new ArrayList<>();
        for (int pr = 0; pr < 60; pr++) {
            Employee emp = employees.get(5 + pr);
            Employee reviewer = emp.getManager() != null ? emp.getManager() : employees.get(0);
            String period = reviewPeriods[pr % 3];

            String status;
            Double rating = null;
            LocalDate rDate = null;

            if (pr < 45) {
                status = "Completed";
                rating = ratingDist[pr % ratingDist.length];
                rDate = today.minusDays(10 + (pr % 50));
            } else if (pr < 55) {
                status = "Reviewed";
                rating = ratingDist[pr % ratingDist.length];
                rDate = today.minusDays(2 + (pr % 5));
            } else {
                status = "In Progress";
                rating = 0.0;
            }

            PerformanceReview review = performanceReviewRepository.save(PerformanceReview.builder()
                    .employee(emp)
                    .reviewedBy(reviewer)
                    .reviewPeriod(period)
                    .goal(goals[pr % goals.length])
                    .achievement(achievements[pr % achievements.length])
                    .rating(rating)
                    .feedback(feedbacks[pr % feedbacks.length])
                    .reviewDate(rDate)
                    .performanceStatus(status)
                    .build());

            reviews.add(review);
        }

        log.info("====================================================================");
        log.info("DEMO DATA SEEDING COMPLETE! SUMMARY OF GENERATED RECORDS:");
        log.info("- Departments: {}", departments.size());
        log.info("- Users:       {}", userRepository.count());
        log.info("- Employees:   {}", employees.size());
        log.info("- Jobs:        {}", jobs.size());
        log.info("- Candidates:  {}", candidates.size());
        log.info("- Onboarding:  {}", onboardings.size());
        log.info("- Attendance:  {}", attendances.size());
        log.info("- Leaves:      {}", leaves.size());
        log.info("- Payroll:     {}", payrolls.size());
        log.info("- Performance: {}", reviews.size());
        log.info("====================================================================");
    }

    private Role getOrCreateRole(String roleName, String description) {
        return roleRepository.findByRoleName(roleName).orElseGet(() ->
                roleRepository.save(Role.builder()
                        .roleName(roleName)
                        .description(description)
                        .build())
        );
    }

    private Department getOrCreateDepartment(String name, String desc, String head) {
        return departmentRepository.findByDepartmentNameIgnoreCase(name).orElseGet(() ->
                departmentRepository.save(Department.builder()
                        .departmentName(name)
                        .description(desc)
                        .departmentHead(head)
                        .status("Active")
                        .build())
        );
    }
}
