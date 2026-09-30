package com.hrgenius.mapper;

import com.hrgenius.dto.attendance.AttendanceDto;
import com.hrgenius.dto.auth.UserDto;
import com.hrgenius.dto.department.DepartmentDto;
import com.hrgenius.dto.employee.EmployeeResponse;
import com.hrgenius.dto.leave.LeaveRequestDto;
import com.hrgenius.dto.onboarding.OnboardingDto;
import com.hrgenius.dto.payroll.PayrollDto;
import com.hrgenius.dto.performance.PerformanceReviewDto;
import com.hrgenius.dto.recruitment.CandidateDto;
import com.hrgenius.dto.recruitment.JobDto;
import com.hrgenius.entity.*;
import org.springframework.stereotype.Component;

@Component
public class EntityMapper {

    public UserDto toUserDto(User user) {
        if (user == null) return null;
        return UserDto.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .roleId(user.getRole() != null ? user.getRole().getRoleId() : null)
                .roleName(user.getRole() != null ? user.getRole().getRoleName() : null)
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .lastLogin(user.getLastLogin())
                .build();
    }

    public DepartmentDto toDepartmentDto(Department dept, Long employeeCount) {
        if (dept == null) return null;
        return DepartmentDto.builder()
                .departmentId(dept.getDepartmentId())
                .departmentName(dept.getDepartmentName())
                .description(dept.getDescription())
                .departmentHead(dept.getDepartmentHead())
                .status(dept.getStatus())
                .employeeCount(employeeCount != null ? employeeCount : 0L)
                .createdAt(dept.getCreatedAt())
                .updatedAt(dept.getUpdatedAt())
                .build();
    }

    public EmployeeResponse toEmployeeResponse(Employee emp) {
        if (emp == null) return null;
        String managerName = null;
        Long managerId = null;
        if (emp.getManager() != null) {
            managerId = emp.getManager().getEmployeeId();
            managerName = emp.getManager().getFirstName() + " " + emp.getManager().getLastName();
        }

        return EmployeeResponse.builder()
                .employeeId(emp.getEmployeeId())
                .employeeCode(emp.getEmployeeCode())
                .userId(emp.getUser() != null ? emp.getUser().getUserId() : null)
                .username(emp.getUser() != null ? emp.getUser().getUsername() : null)
                .firstName(emp.getFirstName())
                .lastName(emp.getLastName())
                .fullName(emp.getFirstName() + " " + emp.getLastName())
                .dateOfBirth(emp.getDateOfBirth())
                .gender(emp.getGender())
                .email(emp.getEmail())
                .phone(emp.getPhone())
                .address(emp.getAddress())
                .dateOfJoining(emp.getDateOfJoining())
                .departmentId(emp.getDepartment() != null ? emp.getDepartment().getDepartmentId() : null)
                .departmentName(emp.getDepartment() != null ? emp.getDepartment().getDepartmentName() : null)
                .managerId(managerId)
                .managerName(managerName)
                .designation(emp.getDesignation())
                .employmentType(emp.getEmploymentType())
                .status(emp.getStatus())
                .createdAt(emp.getCreatedAt())
                .updatedAt(emp.getUpdatedAt())
                .build();
    }

    public JobDto toJobDto(Job job, Long applicantCount) {
        if (job == null) return null;
        return JobDto.builder()
                .jobId(job.getJobId())
                .jobTitle(job.getJobTitle())
                .departmentId(job.getDepartment() != null ? job.getDepartment().getDepartmentId() : null)
                .departmentName(job.getDepartment() != null ? job.getDepartment().getDepartmentName() : null)
                .description(job.getDescription())
                .requirements(job.getRequirements())
                .openings(job.getOpenings())
                .postingDate(job.getPostingDate())
                .closingDate(job.getClosingDate())
                .status(job.getStatus())
                .applicantCount(applicantCount != null ? applicantCount : 0L)
                .createdAt(job.getCreatedAt())
                .build();
    }

    public CandidateDto toCandidateDto(Candidate candidate, Long onboardingId) {
        if (candidate == null) return null;
        return CandidateDto.builder()
                .candidateId(candidate.getCandidateId())
                .jobId(candidate.getJob() != null ? candidate.getJob().getJobId() : null)
                .jobTitle(candidate.getJob() != null ? candidate.getJob().getJobTitle() : null)
                .candidateName(candidate.getCandidateName())
                .candidateEmail(candidate.getCandidateEmail())
                .phone(candidate.getPhone())
                .resumeUrl(candidate.getResumeUrl())
                .applicationDate(candidate.getApplicationDate())
                .applicationStatus(candidate.getApplicationStatus())
                .interviewDate(candidate.getInterviewDate())
                .interviewResult(candidate.getInterviewResult())
                .onboardingId(onboardingId)
                .createdAt(candidate.getCreatedAt())
                .build();
    }

    public OnboardingDto toOnboardingDto(Onboarding onb) {
        if (onb == null) return null;
        String candName = onb.getCandidate() != null ? onb.getCandidate().getCandidateName() : null;
        String candEmail = onb.getCandidate() != null ? onb.getCandidate().getCandidateEmail() : null;
        String candPhone = onb.getCandidate() != null ? onb.getCandidate().getPhone() : null;
        Long empId = onb.getEmployee() != null ? onb.getEmployee().getEmployeeId() : null;
        String empCode = onb.getEmployee() != null ? onb.getEmployee().getEmployeeCode() : null;
        String deptName = onb.getAssignedDepartment() != null ? onb.getAssignedDepartment().getDepartmentName() : null;
        Long managerId = onb.getAssignedManager() != null ? onb.getAssignedManager().getEmployeeId() : null;
        String managerName = onb.getAssignedManager() != null ?
                onb.getAssignedManager().getFirstName() + " " + onb.getAssignedManager().getLastName() : null;

        return OnboardingDto.builder()
                .onboardingId(onb.getOnboardingId())
                .candidateId(onb.getCandidate() != null ? onb.getCandidate().getCandidateId() : null)
                .candidateName(candName)
                .candidateEmail(candEmail)
                .candidatePhone(candPhone)
                .employeeId(empId)
                .employeeCode(empCode)
                .joiningDate(onb.getJoiningDate())
                .documentStatus(onb.getDocumentStatus())
                .verificationStatus(onb.getVerificationStatus())
                .assignedDepartmentId(onb.getAssignedDepartment() != null ? onb.getAssignedDepartment().getDepartmentId() : null)
                .assignedDepartmentName(deptName)
                .assignedManagerId(managerId)
                .assignedManagerName(managerName)
                .onboardingStatus(onb.getOnboardingStatus())
                .createdAt(onb.getCreatedAt())
                .build();
    }

    public AttendanceDto toAttendanceDto(Attendance att) {
        if (att == null) return null;
        String empName = att.getEmployee() != null ? att.getEmployee().getFirstName() + " " + att.getEmployee().getLastName() : null;
        String deptName = (att.getEmployee() != null && att.getEmployee().getDepartment() != null) ?
                att.getEmployee().getDepartment().getDepartmentName() : null;

        return AttendanceDto.builder()
                .attendanceId(att.getAttendanceId())
                .employeeId(att.getEmployee() != null ? att.getEmployee().getEmployeeId() : null)
                .employeeCode(att.getEmployee() != null ? att.getEmployee().getEmployeeCode() : null)
                .employeeName(empName)
                .departmentName(deptName)
                .attendanceDate(att.getAttendanceDate())
                .checkIn(att.getCheckIn())
                .checkOut(att.getCheckOut())
                .attendanceStatus(att.getAttendanceStatus())
                .workingHours(att.getWorkingHours())
                .remarks(att.getRemarks())
                .createdAt(att.getCreatedAt())
                .build();
    }

    public LeaveRequestDto toLeaveRequestDto(LeaveRequest leave) {
        if (leave == null) return null;
        String empName = leave.getEmployee() != null ? leave.getEmployee().getFirstName() + " " + leave.getEmployee().getLastName() : null;
        String deptName = (leave.getEmployee() != null && leave.getEmployee().getDepartment() != null) ?
                leave.getEmployee().getDepartment().getDepartmentName() : null;
        String approverName = leave.getApprovedBy() != null ?
                leave.getApprovedBy().getFirstName() + " " + leave.getApprovedBy().getLastName() : null;

        return LeaveRequestDto.builder()
                .leaveId(leave.getLeaveId())
                .employeeId(leave.getEmployee() != null ? leave.getEmployee().getEmployeeId() : null)
                .employeeCode(leave.getEmployee() != null ? leave.getEmployee().getEmployeeCode() : null)
                .employeeName(empName)
                .departmentName(deptName)
                .leaveType(leave.getLeaveType())
                .startDate(leave.getStartDate())
                .endDate(leave.getEndDate())
                .numberOfDays(leave.getNumberOfDays())
                .reason(leave.getReason())
                .appliedDate(leave.getAppliedDate())
                .approvedById(leave.getApprovedBy() != null ? leave.getApprovedBy().getEmployeeId() : null)
                .approvedByName(approverName)
                .approvalDate(leave.getApprovalDate())
                .leaveStatus(leave.getLeaveStatus())
                .createdAt(leave.getCreatedAt())
                .build();
    }

    public PayrollDto toPayrollDto(Payroll p) {
        if (p == null) return null;
        String empName = p.getEmployee() != null ? p.getEmployee().getFirstName() + " " + p.getEmployee().getLastName() : null;
        String deptName = (p.getEmployee() != null && p.getEmployee().getDepartment() != null) ?
                p.getEmployee().getDepartment().getDepartmentName() : null;
        String desig = p.getEmployee() != null ? p.getEmployee().getDesignation() : null;

        return PayrollDto.builder()
                .payrollId(p.getPayrollId())
                .employeeId(p.getEmployee() != null ? p.getEmployee().getEmployeeId() : null)
                .employeeCode(p.getEmployee() != null ? p.getEmployee().getEmployeeCode() : null)
                .employeeName(empName)
                .designation(desig)
                .departmentName(deptName)
                .payrollMonth(p.getPayrollMonth())
                .basicSalary(p.getBasicSalary())
                .allowances(p.getAllowances())
                .bonus(p.getBonus())
                .deductions(p.getDeductions())
                .tax(p.getTax())
                .grossSalary(p.getGrossSalary())
                .netSalary(p.getNetSalary())
                .paymentDate(p.getPaymentDate())
                .payrollStatus(p.getPayrollStatus())
                .createdAt(p.getCreatedAt())
                .build();
    }

    public PerformanceReviewDto toPerformanceReviewDto(PerformanceReview pr) {
        if (pr == null) return null;
        String empName = pr.getEmployee() != null ? pr.getEmployee().getFirstName() + " " + pr.getEmployee().getLastName() : null;
        String deptName = (pr.getEmployee() != null && pr.getEmployee().getDepartment() != null) ?
                pr.getEmployee().getDepartment().getDepartmentName() : null;
        String reviewerName = pr.getReviewedBy() != null ?
                pr.getReviewedBy().getFirstName() + " " + pr.getReviewedBy().getLastName() : null;

        return PerformanceReviewDto.builder()
                .performanceId(pr.getPerformanceId())
                .employeeId(pr.getEmployee() != null ? pr.getEmployee().getEmployeeId() : null)
                .employeeCode(pr.getEmployee() != null ? pr.getEmployee().getEmployeeCode() : null)
                .employeeName(empName)
                .departmentName(deptName)
                .reviewPeriod(pr.getReviewPeriod())
                .goal(pr.getGoal())
                .achievement(pr.getAchievement())
                .rating(pr.getRating())
                .feedback(pr.getFeedback())
                .reviewedById(pr.getReviewedBy() != null ? pr.getReviewedBy().getEmployeeId() : null)
                .reviewedByName(reviewerName)
                .reviewDate(pr.getReviewDate())
                .performanceStatus(pr.getPerformanceStatus())
                .createdAt(pr.getCreatedAt())
                .build();
    }
}
