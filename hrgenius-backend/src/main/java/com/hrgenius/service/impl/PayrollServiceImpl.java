package com.hrgenius.service.impl;

import com.hrgenius.dto.common.PageResponse;
import com.hrgenius.dto.payroll.GeneratePayrollRequest;
import com.hrgenius.dto.payroll.PayrollDto;
import com.hrgenius.entity.Employee;
import com.hrgenius.entity.Payroll;
import com.hrgenius.exception.BadRequestException;
import com.hrgenius.exception.ResourceNotFoundException;
import com.hrgenius.exception.UnauthorizedException;
import com.hrgenius.mapper.EntityMapper;
import com.hrgenius.repository.EmployeeRepository;
import com.hrgenius.repository.PayrollRepository;
import com.hrgenius.security.SecurityUtils;
import com.hrgenius.service.PayrollService;
import com.hrgenius.service.PdfReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PayrollServiceImpl implements PayrollService {

    private final PayrollRepository payrollRepository;
    private final EmployeeRepository employeeRepository;
    private final PdfReportService pdfReportService;
    private final EntityMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PayrollDto> getPayrolls(Long employeeId, String payrollMonth, String status, Pageable pageable) {
        // Enforce RBAC: If EMPLOYEE role, restrict strictly to their own employee ID
        Long currentEmpId = SecurityUtils.getCurrentEmployeeId();
        String currentRole = SecurityUtils.getCurrentRole();

        if ("ROLE_EMPLOYEE".equals(currentRole)) {
            employeeId = currentEmpId;
        }

        Page<Payroll> page = payrollRepository.filterPayroll(employeeId, payrollMonth, status, pageable);
        return PageResponse.from(page.map(mapper::toPayrollDto));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PayrollDto> getEmployeeSalaryHistory(Long employeeId) {
        Long currentEmpId = SecurityUtils.getCurrentEmployeeId();
        String currentRole = SecurityUtils.getCurrentRole();

        if ("ROLE_EMPLOYEE".equals(currentRole) && !employeeId.equals(currentEmpId)) {
            throw new UnauthorizedException("Employees can only view their own salary history");
        }

        return payrollRepository.findByEmployeeEmployeeIdAndPayrollMonth(employeeId, null)
                .stream().map(mapper::toPayrollDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PayrollDto getPayrollById(Long payrollId) {
        Payroll payroll = payrollRepository.findById(payrollId)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll", "id", payrollId));

        validateEmployeeAccess(payroll);
        return mapper.toPayrollDto(payroll);
    }

    @Override
    @Transactional
    public PayrollDto createOrUpdatePayroll(PayrollDto dto) {
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", dto.getEmployeeId()));

        Payroll payroll;
        if (dto.getPayrollId() != null) {
            payroll = payrollRepository.findById(dto.getPayrollId())
                    .orElseThrow(() -> new ResourceNotFoundException("Payroll", "id", dto.getPayrollId()));
        } else {
            payroll = payrollRepository.findByEmployeeEmployeeIdAndPayrollMonth(dto.getEmployeeId(), dto.getPayrollMonth())
                    .orElseGet(() -> Payroll.builder()
                            .employee(employee)
                            .payrollMonth(dto.getPayrollMonth())
                            .build());
        }

        payroll.setBasicSalary(dto.getBasicSalary());
        payroll.setAllowances(dto.getAllowances() != null ? dto.getAllowances() : BigDecimal.ZERO);
        payroll.setBonus(dto.getBonus() != null ? dto.getBonus() : BigDecimal.ZERO);
        payroll.setDeductions(dto.getDeductions() != null ? dto.getDeductions() : BigDecimal.ZERO);
        payroll.setTax(dto.getTax() != null ? dto.getTax() : BigDecimal.ZERO);
        payroll.setPaymentDate(dto.getPaymentDate());
        if (dto.getPayrollStatus() != null) {
            payroll.setPayrollStatus(dto.getPayrollStatus());
        }

        // Entity @PrePersist / @PreUpdate handles gross/net auto-calc
        payroll.calculateSalaries();

        Payroll saved = payrollRepository.save(payroll);
        return mapper.toPayrollDto(saved);
    }

    @Override
    @Transactional
    public int generateMonthlyPayrollBatch(GeneratePayrollRequest request) {
        List<Employee> targetEmployees;
        if (request.getDepartmentId() != null) {
            targetEmployees = employeeRepository.findByDepartmentDepartmentId(request.getDepartmentId());
        } else {
            targetEmployees = employeeRepository.findByStatus("ACTIVE");
        }

        BigDecimal fallbackBasic = request.getDefaultBasicSalary() != null ?
                request.getDefaultBasicSalary() : new BigDecimal("5000.00");

        int generatedCount = 0;
        for (Employee emp : targetEmployees) {
            if (!payrollRepository.existsByEmployeeEmployeeIdAndPayrollMonth(emp.getEmployeeId(), request.getPayrollMonth())) {
                Payroll payroll = Payroll.builder()
                        .employee(emp)
                        .payrollMonth(request.getPayrollMonth())
                        .basicSalary(fallbackBasic)
                        .allowances(new BigDecimal("500.00"))
                        .bonus(BigDecimal.ZERO)
                        .deductions(new BigDecimal("200.00"))
                        .tax(new BigDecimal("800.00"))
                        .payrollStatus("DRAFT")
                        .build();

                payroll.calculateSalaries();
                payrollRepository.save(payroll);
                generatedCount++;
            }
        }
        return generatedCount;
    }

    @Override
    @Transactional
    public PayrollDto updatePayrollStatus(Long payrollId, String status) {
        Payroll payroll = payrollRepository.findById(payrollId)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll", "id", payrollId));

        payroll.setPayrollStatus(status);
        if ("PAID".equalsIgnoreCase(status) && payroll.getPaymentDate() == null) {
            payroll.setPaymentDate(LocalDate.now());
        }

        Payroll updated = payrollRepository.save(payroll);
        return mapper.toPayrollDto(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] generatePayslipPdf(Long payrollId) {
        Payroll payroll = payrollRepository.findById(payrollId)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll", "id", payrollId));

        validateEmployeeAccess(payroll);
        PayrollDto dto = mapper.toPayrollDto(payroll);
        return pdfReportService.generatePayslipPdf(dto);
    }

    private void validateEmployeeAccess(Payroll payroll) {
        String role = SecurityUtils.getCurrentRole();
        Long currentEmpId = SecurityUtils.getCurrentEmployeeId();
        if ("ROLE_EMPLOYEE".equals(role)) {
            if (currentEmpId == null || !currentEmpId.equals(payroll.getEmployee().getEmployeeId())) {
                throw new UnauthorizedException("Employees can only view and download their own payslips");
            }
        }
    }

    @Override
    @Transactional
    public PayrollDto generateForEmployee(GeneratePayrollRequest request) {
        if (request.getEmployeeId() == null) {
            throw new BadRequestException("employee_id is required");
        }
        Employee emp = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", request.getEmployeeId()));

        Payroll payroll = payrollRepository.findByEmployeeEmployeeIdAndPayrollMonth(request.getEmployeeId(), request.getPayrollMonth())
                .orElseGet(() -> Payroll.builder()
                        .employee(emp)
                        .payrollMonth(request.getPayrollMonth())
                        .build());

        BigDecimal basic = request.getBasicSalary() != null ? request.getBasicSalary() : new BigDecimal("7500.00");
        BigDecimal allowances = request.getAllowances() != null ? request.getAllowances() : new BigDecimal("1200.00");
        BigDecimal bonus = request.getBonus() != null ? request.getBonus() : BigDecimal.ZERO;
        BigDecimal deductions = request.getDeductions() != null ? request.getDeductions() : new BigDecimal("350.00");
        BigDecimal tax = request.getTax() != null ? request.getTax() : new BigDecimal("1200.00");

        payroll.setBasicSalary(basic);
        payroll.setAllowances(allowances);
        payroll.setBonus(bonus);
        payroll.setDeductions(deductions);
        payroll.setTax(tax);
        String status = request.getStatus() != null ? request.getStatus() : "Draft";
        payroll.setPayrollStatus(status);
        if ("Paid".equalsIgnoreCase(status) || "PAID".equalsIgnoreCase(status)) {
            payroll.setPaymentDate(LocalDate.now());
        }
        payroll.calculateSalaries();

        Payroll saved = payrollRepository.save(payroll);
        return mapper.toPayrollDto(saved);
    }

    @Override
    @Transactional
    public List<PayrollDto> generateForAll(String month) {
        GeneratePayrollRequest req = new GeneratePayrollRequest();
        req.setPayrollMonth(month);
        generateMonthlyPayrollBatch(req);
        return payrollRepository.findByPayrollMonth(month).stream()
                .map(mapper::toPayrollDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PayrollDto> getPayrollsByEmployee(Long employeeId) {
        return payrollRepository.findByEmployeeEmployeeIdOrderByPayrollMonthDesc(employeeId).stream()
                .map(mapper::toPayrollDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PayrollDto> getPayrollsByMonth(String month) {
        return payrollRepository.findByPayrollMonth(month).stream()
                .map(mapper::toPayrollDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PayrollDto> getMyPayslips() {
        Long empId = SecurityUtils.getCurrentEmployeeId();
        if (empId == null) {
            Long userId = SecurityUtils.getCurrentUserId();
            if (userId != null) {
                empId = employeeRepository.findByUserUserId(userId).map(Employee::getEmployeeId).orElse(null);
            }
        }
        if (empId == null) {
            return java.util.Collections.emptyList();
        }
        return getPayrollsByEmployee(empId);
    }
}
