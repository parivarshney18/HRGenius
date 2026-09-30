package com.hrgenius.controller;

import com.hrgenius.dto.attendance.AttendanceDto;
import com.hrgenius.dto.attendance.ClockInRequest;
import com.hrgenius.dto.common.ApiResponse;
import com.hrgenius.dto.common.PageResponse;
import com.hrgenius.service.AttendanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
@Tag(name = "Attendance", description = "Endpoints for employee daily clock-in/out, hours tracking, and logs")
public class AttendanceController {

    private final AttendanceService attendanceService;

    @GetMapping
    @Operation(summary = "Get filtered attendance logs (returns List when unpaged, PageResponse when page is provided)")
    public ResponseEntity<?> getAttendance(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "attendanceDate") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        if (page != null) {
            Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
            Pageable pageable = PageRequest.of(page, size, sort);
            return ResponseEntity.ok(attendanceService.getAttendanceRecords(employeeId, departmentId, startDate, endDate, status, pageable));
        }

        Pageable unpaged = PageRequest.of(0, 1000, Sort.by("attendanceDate").descending());
        List<AttendanceDto> list = attendanceService.getAttendanceRecords(employeeId, departmentId, startDate, endDate, status, unpaged).getContent();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/my")
    @Operation(summary = "Get current logged-in employee attendance history")
    public ResponseEntity<List<AttendanceDto>> getMyAttendance() {
        return ResponseEntity.ok(attendanceService.getMyAttendance());
    }

    @GetMapping("/team")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER')")
    @Operation(summary = "Get team attendance records for Manager")
    public ResponseEntity<List<AttendanceDto>> getTeamAttendance() {
        return ResponseEntity.ok(attendanceService.getTeamAttendance());
    }

    @GetMapping("/employee/{employeeId}")
    @Operation(summary = "Get attendance records for a specific employee")
    public ResponseEntity<List<AttendanceDto>> getAttendanceByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(attendanceService.getAttendanceByEmployee(employeeId));
    }

    @GetMapping("/manager/{managerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER')")
    @Operation(summary = "Get attendance records for direct reports of a manager")
    public ResponseEntity<List<AttendanceDto>> getAttendanceByManager(@PathVariable Long managerId) {
        return ResponseEntity.ok(attendanceService.getAttendanceByManager(managerId));
    }

    @GetMapping("/today")
    @Operation(summary = "Get current logged-in employee today's attendance record")
    public ResponseEntity<AttendanceDto> getTodayAttendance(
            @RequestParam(required = false) Long employeeId) {
        return ResponseEntity.ok(attendanceService.getTodayAttendanceForEmployee(employeeId));
    }

    @GetMapping("/today/{employeeId}")
    @Operation(summary = "Get today's attendance record for an employee")
    public ResponseEntity<AttendanceDto> getTodayAttendanceByPath(@PathVariable Long employeeId) {
        return ResponseEntity.ok(attendanceService.getTodayAttendanceForEmployee(employeeId));
    }

    @PostMapping("/check-in")
    @Operation(summary = "Record check-in time for today")
    public ResponseEntity<AttendanceDto> checkIn(@RequestBody(required = false) ClockInRequest request) {
        if (request == null) request = new ClockInRequest();
        AttendanceDto dto = attendanceService.checkIn(request);
        return new ResponseEntity<>(dto, HttpStatus.CREATED);
    }

    @PostMapping("/check-out")
    @Operation(summary = "Record check-out time and auto-calculate working hours")
    public ResponseEntity<AttendanceDto> checkOut(@RequestBody(required = false) ClockInRequest request) {
        if (request == null) request = new ClockInRequest();
        AttendanceDto dto = attendanceService.checkOut(request);
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/manual")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Manually log or correct an attendance entry (Admin / HR)")
    public ResponseEntity<AttendanceDto> recordManual(@RequestBody AttendanceDto dto) {
        AttendanceDto saved = attendanceService.recordManualAttendance(dto);
        return ResponseEntity.ok(saved);
    }
}
