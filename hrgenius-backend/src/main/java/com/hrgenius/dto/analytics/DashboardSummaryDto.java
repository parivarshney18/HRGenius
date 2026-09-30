package com.hrgenius.dto.analytics;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardSummaryDto {
    private long totalEmployees;
    private long newHiresThisMonth;
    private long openJobPositions;
    private long pendingLeaves;
    private long todayPresentCount;
    private long todayAbsentCount;
    private Double todayAttendanceRate;
    private BigDecimal monthlyPayrollTotal;

    // Charting datasets
    private Map<String, Long> departmentHeadcount; // Department Name -> Headcount
    private Map<String, Long> genderDistribution;  // Gender -> Count
    private Map<String, Long> recruitmentFunnel;    // Status -> Count
    private Map<String, Long> leaveStatusSummary;   // Status -> Count
    private Map<String, Long> leaveTypeDistribution;// Type -> Count
    private Map<String, Long> ratingDistribution;   // Star rating (1-5) -> Count
    private List<MonthlyPayrollSummary> payrollTrends;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MonthlyPayrollSummary {
        private String month;
        private BigDecimal totalNetSalary;
        private long employeeCount;
    }
}
