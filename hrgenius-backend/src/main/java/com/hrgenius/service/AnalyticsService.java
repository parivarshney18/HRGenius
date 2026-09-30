package com.hrgenius.service;

import com.hrgenius.dto.analytics.DashboardSummaryDto;

public interface AnalyticsService {
    DashboardSummaryDto getDashboardSummary();
    byte[] exportReportToCsv(String reportType);
    byte[] exportReportToPdf(String reportType);
}
