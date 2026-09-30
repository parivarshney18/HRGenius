package com.hrgenius.dto.leave;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveRequestDto {
    private Long leaveId;

    private Long employeeId; // Optional on submit if logged in as employee
    private String employeeCode;
    private String employeeName;
    private String departmentName;

    @NotBlank(message = "Leave type is required")
    private String leaveType; // CASUAL, SICK, ANNUAL, MATERNITY, PATERNITY, UNPAID

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    private Double numberOfDays; // Auto-calculated by service

    @NotBlank(message = "Reason is required")
    private String reason;

    private LocalDate appliedDate;

    private Long approvedById;
    private String approvedByName;
    private LocalDate approvalDate;

    private String leaveStatus; // PENDING, APPROVED, REJECTED, CANCELLED
    private LocalDateTime createdAt;
}
