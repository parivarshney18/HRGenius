package com.hrgenius.service.impl;

import com.hrgenius.dto.analytics.DashboardSummaryDto;
import com.hrgenius.dto.payroll.PayrollDto;
import com.hrgenius.service.PdfReportService;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Service
public class PdfReportServiceImpl implements PdfReportService {

    private static final Color PRIMARY_COLOR = new Color(30, 64, 175);   // Indigo / Navy
    private static final Color SECONDARY_COLOR = new Color(243, 244, 246); // Light Grey
    private static final Color ACCENT_COLOR = new Color(16, 185, 129);   // Emerald Green
    private static final Color BORDER_COLOR = new Color(209, 213, 219);  // Border Grey

    @Override
    public byte[] generatePayslipPdf(PayrollDto p) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, out);
            document.open();

            // 1. Header Table
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{3f, 2f});

            // Company Title
            Font companyFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, PRIMARY_COLOR);
            Font subFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.DARK_GRAY);

            PdfPCell leftCell = new PdfPCell();
            leftCell.setBorder(Rectangle.NO_BORDER);
            leftCell.addElement(new Paragraph("HRGenius Solutions Inc.", companyFont));
            leftCell.addElement(new Paragraph("Global Enterprise Human Resource Management", subFont));
            leftCell.addElement(new Paragraph("100 Innovation Way, Silicon Valley, CA", subFont));
            headerTable.addCell(leftCell);

            // Document Title
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, Color.BLACK);
            PdfPCell rightCell = new PdfPCell();
            rightCell.setBorder(Rectangle.NO_BORDER);
            rightCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            Paragraph pTitle = new Paragraph("PAYSLIP", titleFont);
            pTitle.setAlignment(Element.ALIGN_RIGHT);
            rightCell.addElement(pTitle);

            Paragraph pMonth = new Paragraph("Period: " + p.getPayrollMonth(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, PRIMARY_COLOR));
            pMonth.setAlignment(Element.ALIGN_RIGHT);
            rightCell.addElement(pMonth);

            Paragraph pStatus = new Paragraph("Status: " + p.getPayrollStatus(), FontFactory.getFont(FontFactory.HELVETICA, 10, ACCENT_COLOR));
            pStatus.setAlignment(Element.ALIGN_RIGHT);
            rightCell.addElement(pStatus);

            headerTable.addCell(rightCell);
            document.add(headerTable);

            document.add(new Paragraph(" ")); // Spacer

            // 2. Employee Info Table
            PdfPTable empTable = new PdfPTable(4);
            empTable.setWidthPercentage(100);
            empTable.setWidths(new float[]{1.5f, 2.5f, 1.5f, 2.5f});

            addCellHeader(empTable, "Employee Code", p.getEmployeeCode());
            addCellHeader(empTable, "Employee Name", p.getEmployeeName());
            addCellHeader(empTable, "Department", p.getDepartmentName());
            addCellHeader(empTable, "Designation", p.getDesignation());
            addCellHeader(empTable, "Payment Date", p.getPaymentDate() != null ? p.getPaymentDate().toString() : "Pending");
            addCellHeader(empTable, "Currency", "USD ($)");

            document.add(empTable);
            document.add(new Paragraph(" ")); // Spacer

            // 3. Earnings & Deductions Breakdown Table
            PdfPTable salaryTable = new PdfPTable(4);
            salaryTable.setWidthPercentage(100);
            salaryTable.setWidths(new float[]{2.5f, 1.5f, 2.5f, 1.5f});

            // Headers
            PdfPCell h1 = createHeaderCell("Earnings", 2);
            PdfPCell h2 = createHeaderCell("Deductions", 2);
            salaryTable.addCell(h1);
            salaryTable.addCell(h2);

            // Row 1
            salaryTable.addCell(createItemCell("Basic Salary:"));
            salaryTable.addCell(createAmountCell("$" + p.getBasicSalary()));
            salaryTable.addCell(createItemCell("Income Tax:"));
            salaryTable.addCell(createAmountCell("-$" + p.getTax()));

            // Row 2
            salaryTable.addCell(createItemCell("Allowances:"));
            salaryTable.addCell(createAmountCell("+$" + p.getAllowances()));
            salaryTable.addCell(createItemCell("Other Deductions:"));
            salaryTable.addCell(createAmountCell("-$" + p.getDeductions()));

            // Row 3
            salaryTable.addCell(createItemCell("Performance Bonus:"));
            salaryTable.addCell(createAmountCell("+$" + p.getBonus()));
            salaryTable.addCell(createItemCell(" "));
            salaryTable.addCell(createAmountCell(" "));

            // Subtotals
            PdfPCell grossLabel = createSubtotalCell("Gross Earnings:", Element.ALIGN_LEFT);
            PdfPCell grossVal = createSubtotalCell("$" + p.getGrossSalary(), Element.ALIGN_RIGHT);
            PdfPCell dedLabel = createSubtotalCell("Total Deductions:", Element.ALIGN_LEFT);
            PdfPCell dedVal = createSubtotalCell("-$" + p.getDeductions().add(p.getTax()), Element.ALIGN_RIGHT);

            salaryTable.addCell(grossLabel);
            salaryTable.addCell(grossVal);
            salaryTable.addCell(dedLabel);
            salaryTable.addCell(dedVal);

            document.add(salaryTable);
            document.add(new Paragraph(" "));

            // 4. Net Salary Callout Box
            PdfPTable netTable = new PdfPTable(1);
            netTable.setWidthPercentage(100);
            PdfPCell netCell = new PdfPCell();
            netCell.setBackgroundColor(SECONDARY_COLOR);
            netCell.setPadding(14);
            netCell.setBorder(Rectangle.BOX);
            netCell.setBorderColor(PRIMARY_COLOR);
            netCell.setBorderWidth(1.5f);

            Paragraph netText = new Paragraph("NET PAYABLE AMOUNT:   $" + p.getNetSalary(),
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 15, PRIMARY_COLOR));
            netText.setAlignment(Element.ALIGN_CENTER);
            netCell.addElement(netText);
            netTable.addCell(netCell);

            document.add(netTable);
            document.add(new Paragraph(" "));
            document.add(new Paragraph(" "));

            // 5. Sign-off / Verification Note
            PdfPTable signTable = new PdfPTable(2);
            signTable.setWidthPercentage(100);

            PdfPCell empSign = new PdfPCell(new Paragraph("Employee Signature: __________________", FontFactory.getFont(FontFactory.HELVETICA, 10)));
            empSign.setBorder(Rectangle.NO_BORDER);
            PdfPCell authSign = new PdfPCell(new Paragraph("Authorized Signatory: __________________", FontFactory.getFont(FontFactory.HELVETICA, 10)));
            authSign.setBorder(Rectangle.NO_BORDER);
            authSign.setHorizontalAlignment(Element.ALIGN_RIGHT);

            signTable.addCell(empSign);
            signTable.addCell(authSign);
            document.add(signTable);

            // Footer note
            Paragraph footer = new Paragraph("\nThis is a system generated payslip from HRGenius and requires no physical seal.",
                    FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, Color.GRAY));
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating payslip PDF: " + e.getMessage(), e);
        }
    }

    @Override
    public byte[] generateHrSummaryPdf(DashboardSummaryDto summary) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, out);
            document.open();

            // Header
            Paragraph title = new Paragraph("HRGenius — Executive HR Analytics Report",
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, PRIMARY_COLOR));
            document.add(title);
            document.add(new Paragraph("Generated at: " + java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
                    FontFactory.getFont(FontFactory.HELVETICA, 10, Color.DARK_GRAY)));
            document.add(new Paragraph(" "));

            // Key Metrics Table
            PdfPTable metricsTable = new PdfPTable(4);
            metricsTable.setWidthPercentage(100);

            addCellHeader(metricsTable, "Total Headcount", String.valueOf(summary.getTotalEmployees()));
            addCellHeader(metricsTable, "New Hires This Month", String.valueOf(summary.getNewHiresThisMonth()));
            addCellHeader(metricsTable, "Open Job Positions", String.valueOf(summary.getOpenJobPositions()));
            addCellHeader(metricsTable, "Pending Leave Requests", String.valueOf(summary.getPendingLeaves()));

            document.add(metricsTable);
            document.add(new Paragraph(" "));

            // Department Headcount Breakdown Table
            Paragraph deptTitle = new Paragraph("Department Headcount Breakdown",
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, PRIMARY_COLOR));
            document.add(deptTitle);
            document.add(new Paragraph(" "));

            PdfPTable deptTable = new PdfPTable(2);
            deptTable.setWidthPercentage(100);
            deptTable.setWidths(new float[]{3f, 1f});

            deptTable.addCell(createHeaderCell("Department Name", 1));
            deptTable.addCell(createHeaderCell("Headcount", 1));

            if (summary.getDepartmentHeadcount() != null) {
                for (Map.Entry<String, Long> entry : summary.getDepartmentHeadcount().entrySet()) {
                    deptTable.addCell(createItemCell(entry.getKey()));
                    deptTable.addCell(createAmountCell(String.valueOf(entry.getValue())));
                }
            }
            document.add(deptTable);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating HR summary PDF: " + e.getMessage(), e);
        }
    }

    private void addCellHeader(PdfPTable table, String label, String value) {
        PdfPCell c1 = new PdfPCell(new Paragraph(label, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.DARK_GRAY)));
        c1.setBackgroundColor(SECONDARY_COLOR);
        c1.setPadding(6);
        c1.setBorderColor(BORDER_COLOR);
        table.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Paragraph(value != null ? value : "N/A", FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK)));
        c2.setPadding(6);
        c2.setBorderColor(BORDER_COLOR);
        table.addCell(c2);
    }

    private PdfPCell createHeaderCell(String text, int colspan) {
        PdfPCell cell = new PdfPCell(new Paragraph(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Color.WHITE)));
        cell.setColspan(colspan);
        cell.setBackgroundColor(PRIMARY_COLOR);
        cell.setPadding(8);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setBorderColor(PRIMARY_COLOR);
        return cell;
    }

    private PdfPCell createItemCell(String text) {
        PdfPCell cell = new PdfPCell(new Paragraph(text, FontFactory.getFont(FontFactory.HELVETICA, 10)));
        cell.setPadding(6);
        cell.setBorderColor(BORDER_COLOR);
        return cell;
    }

    private PdfPCell createAmountCell(String text) {
        PdfPCell cell = new PdfPCell(new Paragraph(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
        cell.setPadding(6);
        cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        cell.setBorderColor(BORDER_COLOR);
        return cell;
    }

    private PdfPCell createSubtotalCell(String text, int align) {
        PdfPCell cell = new PdfPCell(new Paragraph(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, PRIMARY_COLOR)));
        cell.setBackgroundColor(SECONDARY_COLOR);
        cell.setPadding(6);
        cell.setHorizontalAlignment(align);
        cell.setBorderColor(BORDER_COLOR);
        return cell;
    }
}
