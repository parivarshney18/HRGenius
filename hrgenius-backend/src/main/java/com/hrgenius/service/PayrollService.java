package com.hrgenius.service;

import com.hrgenius.dto.common.PageResponse;
import com.hrgenius.dto.payroll.GeneratePayrollRequest;
import com.hrgenius.dto.payroll.PayrollDto;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PayrollService {
    PageResponse<PayrollDto> getPayrolls(Long employeeId, String payrollMonth, String status, Pageable pageable);
    List<PayrollDto> getEmployeeSalaryHistory(Long employeeId);
    PayrollDto getPayrollById(Long payrollId);
    PayrollDto createOrUpdatePayroll(PayrollDto dto);
    int generateMonthlyPayrollBatch(GeneratePayrollRequest request);
    PayrollDto generateForEmployee(GeneratePayrollRequest request);
    List<PayrollDto> generateForAll(String month);
    PayrollDto updatePayrollStatus(Long payrollId, String status);
    byte[] generatePayslipPdf(Long payrollId);
    List<PayrollDto> getPayrollsByEmployee(Long employeeId);
    List<PayrollDto> getPayrollsByMonth(String month);
    List<PayrollDto> getMyPayslips();
}
