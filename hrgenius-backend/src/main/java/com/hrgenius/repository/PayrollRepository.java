package com.hrgenius.repository;

import com.hrgenius.entity.Payroll;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PayrollRepository extends JpaRepository<Payroll, Long> {
    Optional<Payroll> findByEmployeeEmployeeIdAndPayrollMonth(Long employeeId, String payrollMonth);
    boolean existsByEmployeeEmployeeIdAndPayrollMonth(Long employeeId, String payrollMonth);
    List<Payroll> findByPayrollMonth(String payrollMonth);
    List<Payroll> findByEmployeeEmployeeIdOrderByPayrollMonthDesc(Long employeeId);

    @Query("SELECT p FROM Payroll p WHERE " +
           "(:employeeId IS NULL OR p.employee.employeeId = :employeeId) AND " +
           "(:payrollMonth IS NULL OR p.payrollMonth = :payrollMonth) AND " +
           "(:status IS NULL OR p.payrollStatus = :status)")
    Page<Payroll> filterPayroll(
            @Param("employeeId") Long employeeId,
            @Param("payrollMonth") String payrollMonth,
            @Param("status") String status,
            Pageable pageable
    );

    @Query("SELECT SUM(p.grossSalary) FROM Payroll p WHERE p.payrollMonth = :month")
    BigDecimal sumGrossSalaryByMonth(@Param("month") String month);

    @Query("SELECT SUM(p.netSalary) FROM Payroll p WHERE p.payrollMonth = :month")
    BigDecimal sumNetSalaryByMonth(@Param("month") String month);

    @Query("SELECT p.payrollMonth, SUM(p.netSalary), COUNT(p) FROM Payroll p GROUP BY p.payrollMonth ORDER BY p.payrollMonth DESC")
    List<Object[]> findMonthlyPayrollTrends();
}
