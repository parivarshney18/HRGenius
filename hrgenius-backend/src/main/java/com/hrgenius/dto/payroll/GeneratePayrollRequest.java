package com.hrgenius.dto.payroll;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeneratePayrollRequest {
    @NotBlank(message = "Payroll month is required (YYYY-MM)")
    private String payrollMonth;

    private Long employeeId;
    private Long departmentId; // Optional: If provided, generate for specific department only
    private BigDecimal basicSalary;
    private BigDecimal allowances;
    private BigDecimal bonus;
    private BigDecimal deductions;
    private BigDecimal tax;
    private BigDecimal defaultBasicSalary; // Optional fallback
    private String status;
}
