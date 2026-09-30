package com.hrgenius.dto.dashboard;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsDto {

    @JsonProperty("total_employees")
    private Long totalEmployees;

    @JsonProperty("new_hires")
    private Long newHires;

    @JsonProperty("open_positions")
    private Long openPositions;

    @JsonProperty("pending_leaves")
    private Long pendingLeaves;

    @JsonProperty("department_wise_headcount")
    private Map<String, Long> departmentWiseHeadcount;

    @JsonProperty("attendance_summary")
    private Map<String, Long> attendanceSummary;

    @JsonProperty("leave_summary")
    private Map<String, Long> leaveSummary;

    @JsonProperty("recruitment_funnel")
    private Map<String, Long> recruitmentFunnel;

    @JsonProperty("payroll_summary")
    private Object payrollSummary;

    @JsonProperty("rating_distribution")
    private Map<String, Long> ratingDistribution;
}
