package com.hrgenius.service.impl;

import com.hrgenius.dto.dashboard.DashboardStatsDto;
import com.hrgenius.entity.*;
import com.hrgenius.repository.*;
import com.hrgenius.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final JobRepository jobRepository;
    private final CandidateRepository candidateRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final AttendanceRepository attendanceRepository;
    private final PayrollRepository payrollRepository;
    private final PerformanceReviewRepository performanceReviewRepository;

    @Override
    @Transactional(readOnly = true)
    public DashboardStatsDto getDashboardStats() {
        long totalEmployees = employeeRepository.count();

        long newHires = employeeRepository.findAll().stream()
                .filter(e -> e.getDateOfJoining() != null && e.getDateOfJoining().getYear() >= 2025)
                .count();

        long openPositions = jobRepository.findAll().stream()
                .filter(j -> "OPEN".equalsIgnoreCase(j.getStatus()))
                .mapToLong(j -> j.getOpenings() != null ? j.getOpenings() : 1)
                .sum();

        long pendingLeaves = leaveRequestRepository.findAll().stream()
                .filter(l -> "PENDING".equalsIgnoreCase(l.getLeaveStatus()))
                .count();

        // Department-wise headcount
        List<Department> departments = departmentRepository.findAll();
        List<Employee> allEmployees = employeeRepository.findAll();
        Map<String, Long> deptHeadcount = new LinkedHashMap<>();
        for (Department d : departments) {
            long count = allEmployees.stream()
                    .filter(e -> e.getDepartment() != null && e.getDepartment().getDepartmentId().equals(d.getDepartmentId()))
                    .count();
            deptHeadcount.put(d.getDepartmentName(), count);
        }

        // Attendance summary
        List<Attendance> attendances = attendanceRepository.findAll();
        Map<String, Long> attSummary = new LinkedHashMap<>();
        attSummary.put("Present", attendances.stream().filter(a -> "Present".equalsIgnoreCase(a.getAttendanceStatus())).count());
        attSummary.put("Late", attendances.stream().filter(a -> "Late".equalsIgnoreCase(a.getAttendanceStatus())).count());
        attSummary.put("Half-day", attendances.stream().filter(a -> "Half-day".equalsIgnoreCase(a.getAttendanceStatus())).count());
        attSummary.put("Absent", attendances.stream().filter(a -> "Absent".equalsIgnoreCase(a.getAttendanceStatus())).count());

        // Leave summary
        List<LeaveRequest> leaves = leaveRequestRepository.findAll();
        Map<String, Long> leaveSummary = new LinkedHashMap<>();
        leaveSummary.put("Approved", leaves.stream().filter(l -> "APPROVED".equalsIgnoreCase(l.getLeaveStatus())).count());
        leaveSummary.put("Pending Approval", leaves.stream().filter(l -> "PENDING".equalsIgnoreCase(l.getLeaveStatus())).count());
        leaveSummary.put("Rejected", leaves.stream().filter(l -> "REJECTED".equalsIgnoreCase(l.getLeaveStatus())).count());

        // Recruitment funnel
        List<Candidate> candidates = candidateRepository.findAll();
        Map<String, Long> funnel = new LinkedHashMap<>();
        funnel.put("1. Applied", candidates.stream().filter(c -> "Applied".equalsIgnoreCase(c.getApplicationStatus())).count());
        funnel.put("2. Shortlisted", candidates.stream().filter(c -> "Shortlisted".equalsIgnoreCase(c.getApplicationStatus())).count());
        funnel.put("3. Interviewed", candidates.stream().filter(c -> "Interviewed".equalsIgnoreCase(c.getApplicationStatus())).count());
        funnel.put("4. Selected", candidates.stream().filter(c -> "Selected".equalsIgnoreCase(c.getApplicationStatus())).count());
        funnel.put("5. Rejected", candidates.stream().filter(c -> "Rejected".equalsIgnoreCase(c.getApplicationStatus())).count());

        // Payroll summary for the 3 generated months
        List<Payroll> payrolls = payrollRepository.findAll();
        String[] months = {"2026-07", "2026-08", "2026-09"};
        String[] monthLabels = {"July 2026", "August 2026", "September 2026"};
        List<Map<String, Object>> payrollSummaryList = new ArrayList<>();

        for (int m = 0; m < months.length; m++) {
            String mStr = months[m];
            double mGross = payrolls.stream()
                    .filter(p -> mStr.equals(p.getPayrollMonth()) && p.getGrossSalary() != null)
                    .mapToDouble(p -> p.getGrossSalary().doubleValue())
                    .sum();
            double mNet = payrolls.stream()
                    .filter(p -> mStr.equals(p.getPayrollMonth()) && p.getNetSalary() != null)
                    .mapToDouble(p -> p.getNetSalary().doubleValue())
                    .sum();

            Map<String, Object> pMap = new LinkedHashMap<>();
            pMap.put("month", monthLabels[m]);
            pMap.put("payroll_month", mStr);
            pMap.put("gross_salary", mGross);
            pMap.put("net_salary", mNet);
            payrollSummaryList.add(pMap);
        }

        // Performance rating distribution
        List<PerformanceReview> reviews = performanceReviewRepository.findAll();
        Map<String, Long> ratingDist = new LinkedHashMap<>();
        ratingDist.put("5 Stars", reviews.stream().filter(r -> r.getRating() != null && Math.round(r.getRating()) == 5).count());
        ratingDist.put("4 Stars", reviews.stream().filter(r -> r.getRating() != null && Math.round(r.getRating()) == 4).count());
        ratingDist.put("3 Stars", reviews.stream().filter(r -> r.getRating() != null && Math.round(r.getRating()) == 3).count());
        ratingDist.put("2 Stars", reviews.stream().filter(r -> r.getRating() != null && Math.round(r.getRating()) == 2).count());
        ratingDist.put("1 Star", reviews.stream().filter(r -> r.getRating() != null && Math.round(r.getRating()) == 1).count());

        return DashboardStatsDto.builder()
                .totalEmployees(totalEmployees)
                .newHires(newHires)
                .openPositions(openPositions)
                .pendingLeaves(pendingLeaves)
                .departmentWiseHeadcount(deptHeadcount)
                .attendanceSummary(attSummary)
                .leaveSummary(leaveSummary)
                .recruitmentFunnel(funnel)
                .payrollSummary(payrollSummaryList)
                .ratingDistribution(ratingDist)
                .build();
    }
}
