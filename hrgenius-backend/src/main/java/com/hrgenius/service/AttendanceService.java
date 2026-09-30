package com.hrgenius.service;

import com.hrgenius.dto.attendance.AttendanceDto;
import com.hrgenius.dto.attendance.ClockInRequest;
import com.hrgenius.dto.common.PageResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface AttendanceService {
    PageResponse<AttendanceDto> getAttendanceRecords(Long employeeId, Long departmentId, LocalDate startDate, LocalDate endDate, String status, Pageable pageable);
    AttendanceDto getTodayAttendanceForEmployee(Long employeeId);
    AttendanceDto checkIn(ClockInRequest request);
    AttendanceDto checkOut(ClockInRequest request);
    AttendanceDto recordManualAttendance(AttendanceDto dto);
    java.util.List<AttendanceDto> getAttendanceByEmployee(Long employeeId);
    java.util.List<AttendanceDto> getAttendanceByManager(Long managerId);
    java.util.List<AttendanceDto> getMyAttendance();
    java.util.List<AttendanceDto> getTeamAttendance();
}
