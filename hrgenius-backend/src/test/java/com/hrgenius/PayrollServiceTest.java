package com.hrgenius;

import com.hrgenius.dto.payroll.PayrollDto;
import com.hrgenius.entity.Department;
import com.hrgenius.entity.Employee;
import com.hrgenius.entity.Payroll;
import com.hrgenius.mapper.EntityMapper;
import com.hrgenius.repository.EmployeeRepository;
import com.hrgenius.repository.PayrollRepository;
import com.hrgenius.service.PdfReportService;
import com.hrgenius.service.impl.PayrollServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PayrollServiceTest {

    @Mock
    private PayrollRepository payrollRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private PdfReportService pdfReportService;

    @Spy
    private EntityMapper mapper;

    @InjectMocks
    private PayrollServiceImpl payrollService;

    private Employee employee;

    @BeforeEach
    void setUp() {
        Department dept = Department.builder().departmentId(1L).departmentName("Finance").build();
        employee = Employee.builder()
                .employeeId(200L)
                .employeeCode("EMP-2001")
                .firstName("Sarah")
                .lastName("Connor")
                .designation("HR Director")
                .department(dept)
                .build();
    }

    @Test
    void createOrUpdatePayroll_AutoCalculatesGrossAndNet() {
        PayrollDto dto = PayrollDto.builder()
                .employeeId(200L)
                .payrollMonth("2026-09")
                .basicSalary(new BigDecimal("8000.00"))
                .allowances(new BigDecimal("1000.00"))
                .bonus(new BigDecimal("500.00"))
                .deductions(new BigDecimal("300.00"))
                .tax(new BigDecimal("1200.00"))
                .payrollStatus("DRAFT")
                .build();

        when(employeeRepository.findById(200L)).thenReturn(Optional.of(employee));
        when(payrollRepository.findByEmployeeEmployeeIdAndPayrollMonth(200L, "2026-09"))
                .thenReturn(Optional.empty());
        when(payrollRepository.save(any(Payroll.class))).thenAnswer(i -> {
            Payroll saved = i.getArgument(0);
            saved.setPayrollId(701L);
            return saved;
        });

        PayrollDto result = payrollService.createOrUpdatePayroll(dto);

        assertNotNull(result);
        // Gross = 8000 + 1000 + 500 = 9500
        assertEquals(new BigDecimal("9500.00"), result.getGrossSalary());
        // Net = 9500 - 300 - 1200 = 8000
        assertEquals(new BigDecimal("8000.00"), result.getNetSalary());
        verify(payrollRepository, times(1)).save(any(Payroll.class));
    }
}
