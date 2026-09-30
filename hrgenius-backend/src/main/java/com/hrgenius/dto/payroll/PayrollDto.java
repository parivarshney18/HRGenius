package com.hrgenius.dto.payroll;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollDto {
    private Long payrollId;

    @NotNull(message = "Employee ID is required")
    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private String designation;
    private String departmentName;

    @NotBlank(message = "Payroll month is required (YYYY-MM)")
    private String payrollMonth;

    @NotNull(message = "Basic salary is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Basic salary must be greater than zero")
    private BigDecimal basicSalary;

    private BigDecimal allowances;
    private BigDecimal bonus;
    private BigDecimal deductions;
    private BigDecimal tax;

    private BigDecimal grossSalary; // Auto-calculated: basic + allowances + bonus
    private BigDecimal netSalary;   // Auto-calculated: gross - deductions - tax

    private LocalDate paymentDate;
    private String payrollStatus;   // DRAFT, PROCESSED, PAID
    private LocalDateTime createdAt;
}
