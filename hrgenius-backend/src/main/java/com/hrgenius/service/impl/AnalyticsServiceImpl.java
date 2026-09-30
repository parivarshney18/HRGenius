package com.hrgenius.service.impl;

import com.hrgenius.dto.analytics.DashboardSummaryDto;
import com.hrgenius.entity.Employee;
import com.hrgenius.entity.Job;
import com.hrgenius.entity.Payroll;
import com.hrgenius.exception.BadRequestException;
import com.hrgenius.repository.*;
import com.hrgenius.service.AnalyticsService;
import com.hrgenius.service.PdfReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {

    private final EmployeeRepository employeeRepository;
    private final JobRepository jobRepository;
    private final CandidateRepository candidateRepository;
    private final AttendanceRepository attendanceRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final PayrollRepository payrollRepository;
    private final PerformanceReviewRepository performanceReviewRepository;
    private final PdfReportService pdfReportService;

    @Override
    @Transactional(readOnly = true)
    public DashboardSummaryDto getDashboardSummary() {
        long totalEmployees = employeeRepository.count();
        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.withDayOfMonth(1);

        long newHires = employeeRepository.findByStatus("ACTIVE").stream()
                .filter(e -> e.getDateOfJoining() != null && !e.getDateOfJoining().isBefore(startOfMonth))
                .count();

        long openJobs = jobRepository.findByStatus("OPEN").size();

        // Attendance stats for today
        List<Object[]> attStats = attendanceRepository.countAttendanceByStatusForDate(now);
        long presentCount = 0;
        long absentCount = 0;
        for (Object[] row : attStats) {
            String status = (String) row[0];
            Long count = ((Number) row[1]).longValue();
            if ("PRESENT".equalsIgnoreCase(status) || "HALF_DAY".equalsIgnoreCase(status)) {
                presentCount += count;
            } else {
                absentCount += count;
            }
        }

        Double attRate = 0.0;
        if (totalEmployees > 0) {
            attRate = BigDecimal.valueOf((double) presentCount / totalEmployees * 100.0)
                    .setScale(1, RoundingMode.HALF_UP).doubleValue();
        }

        // Leave stats
        Map<String, Long> leaveStatusSummary = new LinkedHashMap<>();
        long pendingLeaves = 0;
        for (Object[] row : leaveRequestRepository.countLeavesByStatus()) {
            String st = (String) row[0];
            Long cnt = ((Number) row[1]).longValue();
            leaveStatusSummary.put(st, cnt);
            if ("PENDING".equalsIgnoreCase(st)) pendingLeaves = cnt;
        }

        Map<String, Long> leaveTypeDist = new LinkedHashMap<>();
        for (Object[] row : leaveRequestRepository.countLeavesByType()) {
            leaveTypeDist.put((String) row[0], ((Number) row[1]).longValue());
        }

        // Department headcount
        Map<String, Long> deptHeadcount = new LinkedHashMap<>();
        for (Object[] row : employeeRepository.countEmployeesByDepartment()) {
            deptHeadcount.put((String) row[0], ((Number) row[1]).longValue());
        }

        // Gender distribution
        Map<String, Long> genderDist = new LinkedHashMap<>();
        for (Object[] row : employeeRepository.countEmployeesByGender()) {
            genderDist.put((String) row[0], ((Number) row[1]).longValue());
        }

        // Recruitment funnel
        Map<String, Long> funnel = new LinkedHashMap<>();
        for (Object[] row : candidateRepository.countCandidatesByStatus()) {
            funnel.put((String) row[0], ((Number) row[1]).longValue());
        }

        // Performance rating distribution
        Map<String, Long> ratings = new LinkedHashMap<>();
        for (int i = 1; i <= 5; i++) ratings.put(i + " Star", 0L);
        for (Object[] row : performanceReviewRepository.getRatingDistribution()) {
            if (row[0] != null) {
                int star = ((Number) row[0]).intValue();
                Long cnt = ((Number) row[1]).longValue();
                ratings.put(star + " Star", cnt);
            }
        }

        // Payroll month total
        String currentMonth = YearMonth.now().toString();
        BigDecimal monthTotal = payrollRepository.sumNetSalaryByMonth(currentMonth);
        if (monthTotal == null) {
            monthTotal = payrollRepository.sumNetSalaryByMonth(YearMonth.now().minusMonths(1).toString());
            if (monthTotal == null) monthTotal = BigDecimal.ZERO;
        }

        // Payroll trends
        List<DashboardSummaryDto.MonthlyPayrollSummary> trends = new ArrayList<>();
        for (Object[] row : payrollRepository.findMonthlyPayrollTrends()) {
            trends.add(DashboardSummaryDto.MonthlyPayrollSummary.builder()
                    .month((String) row[0])
                    .totalNetSalary((BigDecimal) row[1])
                    .employeeCount(((Number) row[2]).longValue())
                    .build());
        }

        return DashboardSummaryDto.builder()
                .totalEmployees(totalEmployees)
                .newHiresThisMonth(newHires)
                .openJobPositions(openJobs)
                .pendingLeaves(pendingLeaves)
                .todayPresentCount(presentCount)
                .todayAbsentCount(absentCount)
                .todayAttendanceRate(attRate)
                .monthlyPayrollTotal(monthTotal)
                .departmentHeadcount(deptHeadcount)
                .genderDistribution(genderDist)
                .recruitmentFunnel(funnel)
                .leaveStatusSummary(leaveStatusSummary)
                .leaveTypeDistribution(leaveTypeDist)
                .ratingDistribution(ratings)
                .payrollTrends(trends)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportReportToCsv(String reportType) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream();
             PrintWriter writer = new PrintWriter(out)) {

            String type = reportType != null ? reportType.toLowerCase() : "employees";
            switch (type) {
                case "employees":
                    writer.println("EmployeeCode,FirstName,LastName,Email,Phone,Department,Designation,EmploymentType,Status,DateOfJoining");
                    for (Employee e : employeeRepository.findAll()) {
                        String dept = e.getDepartment() != null ? e.getDepartment().getDepartmentName() : "";
                        writer.printf("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"%n",
                                e.getEmployeeCode(), e.getFirstName(), e.getLastName(), e.getEmail(),
                                e.getPhone(), dept, e.getDesignation(), e.getEmploymentType(), e.getStatus(), e.getDateOfJoining());
                    }
                    break;
                case "payroll":
                    writer.println("PayrollId,EmployeeCode,EmployeeName,Month,BasicSalary,Allowances,Bonus,Deductions,Tax,GrossSalary,NetSalary,Status");
                    for (Payroll p : payrollRepository.findAll()) {
                        String empName = p.getEmployee() != null ? p.getEmployee().getFirstName() + " " + p.getEmployee().getLastName() : "";
                        String empCode = p.getEmployee() != null ? p.getEmployee().getEmployeeCode() : "";
                        writer.printf("\"%d\",\"%s\",\"%s\",\"%s\",%.2f,%.2f,%.2f,%.2f,%.2f,%.2f,%.2f,\"%s\"%n",
                                p.getPayrollId(), empCode, empName, p.getPayrollMonth(),
                                p.getBasicSalary(), p.getAllowances(), p.getBonus(), p.getDeductions(), p.getTax(),
                                p.getGrossSalary(), p.getNetSalary(), p.getPayrollStatus());
                    }
                    break;
                default:
                    throw new BadRequestException("Unsupported report type: " + reportType);
            }

            writer.flush();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error exporting CSV: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportReportToPdf(String reportType) {
        DashboardSummaryDto summary = getDashboardSummary();
        return pdfReportService.generateHrSummaryPdf(summary);
    }
}
