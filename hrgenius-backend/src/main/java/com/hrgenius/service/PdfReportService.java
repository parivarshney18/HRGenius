package com.hrgenius.service;

import com.hrgenius.dto.payroll.PayrollDto;
import com.hrgenius.dto.analytics.DashboardSummaryDto;

public interface PdfReportService {
    byte[] generatePayslipPdf(PayrollDto payroll);
    byte[] generateHrSummaryPdf(DashboardSummaryDto summary);
}
