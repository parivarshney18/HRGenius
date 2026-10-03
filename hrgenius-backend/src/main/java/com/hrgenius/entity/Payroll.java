package com.hrgenius.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "PAYROLL", uniqueConstraints = {
    @UniqueConstraint(name = "UK_PAYROLL_EMP_MONTH", columnNames = {"employee_id", "payroll_month"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payroll extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payroll_id")
    private Long payrollId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "payroll_month", length = 7, nullable = false) // YYYY-MM
    private String payrollMonth;

    @Column(name = "basic_salary", precision = 12, scale = 2, nullable = false)
    private BigDecimal basicSalary;

    @Column(name = "allowances", precision = 12, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal allowances = BigDecimal.ZERO;

    @Column(name = "bonus", precision = 12, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal bonus = BigDecimal.ZERO;

    @Column(name = "deductions", precision = 12, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal deductions = BigDecimal.ZERO;

    @Column(name = "tax", precision = 12, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal tax = BigDecimal.ZERO;

    @Column(name = "gross_salary", precision = 12, scale = 2, nullable = false)
    private BigDecimal grossSalary;

    @Column(name = "net_salary", precision = 12, scale = 2, nullable = false)
    private BigDecimal netSalary;

    @Column(name = "payment_date")
    private LocalDate paymentDate;

    @Column(name = "payroll_status", length = 20, nullable = false)
    @Builder.Default
    private String payrollStatus = "DRAFT"; // DRAFT, PROCESSED, PAID

    @PrePersist
    @PreUpdate
    public void calculateSalaries() {
        if (basicSalary == null) basicSalary = BigDecimal.ZERO;
        if (allowances == null) allowances = BigDecimal.ZERO;
        if (bonus == null) bonus = BigDecimal.ZERO;
        if (deductions == null) deductions = BigDecimal.ZERO;
        if (tax == null) tax = BigDecimal.ZERO;

        this.grossSalary = basicSalary.add(allowances).add(bonus);
        this.netSalary = grossSalary.subtract(deductions).subtract(tax);
    }
}
