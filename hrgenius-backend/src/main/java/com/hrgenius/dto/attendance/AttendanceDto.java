package com.hrgenius.dto.attendance;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceDto {
    private Long attendanceId;

    @NotNull(message = "Employee ID is required")
    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private String departmentName;

    @NotNull(message = "Attendance date is required")
    private LocalDate attendanceDate;

    private LocalDateTime checkIn;
    private LocalDateTime checkOut;

    @JsonProperty("check_in")
    public String getCheckInFormatted() {
        if (checkIn == null) return null;
        return String.format("%02d:%02d", checkIn.getHour(), checkIn.getMinute());
    }

    @JsonProperty("check_in")
    public void setCheckInFlexible(Object val) {
        if (val == null) {
            this.checkIn = null;
        } else if (val instanceof String s && !s.isBlank()) {
            if (s.length() == 5) {
                this.checkIn = LocalDate.now().atTime(java.time.LocalTime.parse(s));
            } else {
                try {
                    this.checkIn = LocalDateTime.parse(s.replace(" ", "T"));
                } catch (Exception e) {
                    this.checkIn = null;
                }
            }
        }
    }

    @JsonProperty("check_out")
    public String getCheckOutFormatted() {
        if (checkOut == null) return null;
        return String.format("%02d:%02d", checkOut.getHour(), checkOut.getMinute());
    }

    @JsonProperty("check_out")
    public void setCheckOutFlexible(Object val) {
        if (val == null) {
            this.checkOut = null;
        } else if (val instanceof String s && !s.isBlank()) {
            if (s.length() == 5) {
                this.checkOut = LocalDate.now().atTime(java.time.LocalTime.parse(s));
            } else {
                try {
                    this.checkOut = LocalDateTime.parse(s.replace(" ", "T"));
                } catch (Exception e) {
                    this.checkOut = null;
                }
            }
        }
    }

    private String attendanceStatus; // Present, Absent, Half-day, Late
    private Double workingHours;
    private String remarks;
    private LocalDateTime createdAt;
}
