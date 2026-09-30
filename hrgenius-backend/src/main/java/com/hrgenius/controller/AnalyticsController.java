package com.hrgenius.controller;

import com.hrgenius.dto.analytics.DashboardSummaryDto;
import com.hrgenius.dto.common.ApiResponse;
import com.hrgenius.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Tag(name = "HR Analytics & Reports", description = "Endpoints for KPI dashboards, distributions, and CSV/PDF export")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER')")
    @Operation(summary = "Get high-level HR metrics and charts dataset")
    public ResponseEntity<ApiResponse<DashboardSummaryDto>> getDashboardSummary() {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getDashboardSummary()));
    }

    @GetMapping("/export/csv")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Export HR reports to CSV format (employees or payroll)")
    public ResponseEntity<byte[]> exportCsv(@RequestParam(defaultValue = "employees") String type) {
        byte[] csvData = analyticsService.exportReportToCsv(type);
        String filename = String.format("%s_report_%s.csv", type, java.time.LocalDate.now());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", filename);

        return ResponseEntity.ok()
                .headers(headers)
                .body(csvData);
    }

    @GetMapping("/export/pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Export comprehensive HR analytics summary report to PDF")
    public ResponseEntity<byte[]> exportPdf(@RequestParam(defaultValue = "summary") String type) {
        byte[] pdfData = analyticsService.exportReportToPdf(type);
        String filename = String.format("hr_analytics_%s.pdf", java.time.LocalDate.now());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", filename);

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfData);
    }
}
