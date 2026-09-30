package com.hrgenius.controller;

import com.hrgenius.dto.common.ApiResponse;
import com.hrgenius.dto.common.PageResponse;
import com.hrgenius.dto.payroll.GeneratePayrollRequest;
import com.hrgenius.dto.payroll.PayrollDto;
import com.hrgenius.service.PayrollService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payroll")
@RequiredArgsConstructor
@Tag(name = "Payroll", description = "Endpoints for salary calculation, batch payroll processing, and downloadable PDF payslips")
public class PayrollController {

    private final PayrollService payrollService;

    @GetMapping
    @Operation(summary = "Get filtered payroll records (returns List when unpaged, PageResponse when page is provided)")
    public ResponseEntity<?> getPayrolls(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String payrollMonth,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "payrollMonth") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        if (page != null) {
            Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
            Pageable pageable = PageRequest.of(page, size, sort);
            return ResponseEntity.ok(payrollService.getPayrolls(employeeId, payrollMonth, status, pageable));
        }

        Pageable unpaged = PageRequest.of(0, 1000, Sort.by("payrollMonth").descending());
        List<PayrollDto> list = payrollService.getPayrolls(employeeId, payrollMonth, status, unpaged).getContent();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/my")
    @Operation(summary = "Get current logged-in employee payslips")
    public ResponseEntity<List<PayrollDto>> getMyPayslips() {
        return ResponseEntity.ok(payrollService.getMyPayslips());
    }

    @GetMapping("/employee/{employeeId}")
    @Operation(summary = "Get payroll records by employee ID")
    public ResponseEntity<List<PayrollDto>> getPayrollsByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(payrollService.getPayrollsByEmployee(employeeId));
    }

    @GetMapping("/month/{month}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Get payroll records for a specific month (YYYY-MM)")
    public ResponseEntity<List<PayrollDto>> getPayrollsByMonth(@PathVariable String month) {
        return ResponseEntity.ok(payrollService.getPayrollsByMonth(month));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get payroll details by ID")
    public ResponseEntity<PayrollDto> getPayrollById(@PathVariable Long id) {
        return ResponseEntity.ok(payrollService.getPayrollById(id));
    }

    @GetMapping("/history/{employeeId}")
    @Operation(summary = "Get employee salary history (Employee can only query own history)")
    public ResponseEntity<List<PayrollDto>> getEmployeeSalaryHistory(@PathVariable Long employeeId) {
        return ResponseEntity.ok(payrollService.getEmployeeSalaryHistory(employeeId));
    }

    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Generate payroll for a single employee")
    public ResponseEntity<PayrollDto> generateForEmployee(@RequestBody GeneratePayrollRequest request) {
        PayrollDto result = payrollService.generateForEmployee(request);
        return new ResponseEntity<>(result, HttpStatus.CREATED);
    }

    @PostMapping("/generate-bulk")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Generate payroll for all active employees for a given month")
    public ResponseEntity<List<PayrollDto>> generateBulk(@RequestBody java.util.Map<String, String> body) {
        String month = body.get("payroll_month");
        if (month == null) month = body.get("payrollMonth");
        if (month == null) {
            throw new IllegalArgumentException("payroll_month is required");
        }
        List<PayrollDto> list = payrollService.generateForAll(month);
        return ResponseEntity.ok(list);
    }

    @PostMapping("/generate-all")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Alias for bulk payroll generation")
    public ResponseEntity<List<PayrollDto>> generateAll(@RequestBody java.util.Map<String, String> body) {
        return generateBulk(body);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Create or update an employee payroll record (Admin / HR)")
    public ResponseEntity<PayrollDto> createOrUpdatePayroll(@Valid @RequestBody PayrollDto dto) {
        PayrollDto saved = payrollService.createOrUpdatePayroll(dto);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PostMapping("/generate-batch")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Generate batch payroll for all active employees for a month (Admin / HR)")
    public ResponseEntity<Integer> generateBatch(@Valid @RequestBody GeneratePayrollRequest request) {
        int count = payrollService.generateMonthlyPayrollBatch(request);
        return ResponseEntity.ok(count);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Update payroll status (Draft, Processed, Paid)")
    public ResponseEntity<PayrollDto> updateStatus(
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, String> body,
            @RequestParam(required = false) String status) {
        String finalStatus = status;
        if (finalStatus == null && body != null) {
            finalStatus = body.get("payroll_status");
            if (finalStatus == null) finalStatus = body.get("status");
        }
        if (finalStatus == null) finalStatus = "Processed";
        PayrollDto updated = payrollService.updatePayrollStatus(id, finalStatus);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Patch payroll status (Draft, Processed, Paid)")
    public ResponseEntity<PayrollDto> patchStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        PayrollDto updated = payrollService.updatePayrollStatus(id, status);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{id}/payslip")
    @Operation(summary = "Download official payslip PDF document")
    public ResponseEntity<byte[]> downloadPayslipPdf(@PathVariable Long id) {
        byte[] pdfBytes = payrollService.generatePayslipPdf(id);
        PayrollDto payroll = payrollService.getPayrollById(id);

        String filename = String.format("payslip_%s_%s.pdf",
                payroll.getPayrollMonth(),
                payroll.getEmployeeCode() != null ? payroll.getEmployeeCode() : "EMP");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", filename);
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}
