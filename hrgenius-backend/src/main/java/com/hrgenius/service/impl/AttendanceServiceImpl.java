package com.hrgenius.service.impl;

import com.hrgenius.dto.attendance.AttendanceDto;
import com.hrgenius.dto.attendance.ClockInRequest;
import com.hrgenius.dto.common.PageResponse;
import com.hrgenius.entity.Attendance;
import com.hrgenius.entity.Employee;
import com.hrgenius.exception.BadRequestException;
import com.hrgenius.exception.ResourceNotFoundException;
import com.hrgenius.mapper.EntityMapper;
import com.hrgenius.repository.AttendanceRepository;
import com.hrgenius.repository.EmployeeRepository;
import com.hrgenius.security.SecurityUtils;
import com.hrgenius.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;
    private final EntityMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AttendanceDto> getAttendanceRecords(
            Long employeeId, Long departmentId, LocalDate startDate, LocalDate endDate, String status, Pageable pageable) {
        Page<Attendance> page = attendanceRepository.filterAttendance(employeeId, departmentId, startDate, endDate, status, pageable);
        return PageResponse.from(page.map(mapper::toAttendanceDto));
    }

    @Override
    @Transactional(readOnly = true)
    public AttendanceDto getTodayAttendanceForEmployee(Long employeeId) {
        Long targetEmpId = resolveEmployeeId(employeeId);
        return attendanceRepository.findByEmployeeEmployeeIdAndAttendanceDate(targetEmpId, LocalDate.now())
                .map(mapper::toAttendanceDto)
                .orElse(null);
    }

    @Override
    @Transactional
    public AttendanceDto checkIn(ClockInRequest request) {
        Long targetEmpId = resolveEmployeeId(request.getEmployeeId());
        Employee employee = employeeRepository.findById(targetEmpId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", targetEmpId));

        LocalDate today = LocalDate.now();
        Attendance attendance = attendanceRepository.findByEmployeeEmployeeIdAndAttendanceDate(targetEmpId, today)
                .orElseGet(() -> Attendance.builder()
                        .employee(employee)
                        .attendanceDate(today)
                        .build());

        if (attendance.getCheckIn() != null) {
            throw new BadRequestException("Employee already checked in today at " + attendance.getCheckIn().toLocalTime());
        }

        LocalDateTime now = LocalDateTime.now();
        attendance.setCheckIn(now);
        boolean isLate = now.getHour() > 9 || (now.getHour() == 9 && now.getMinute() > 30);
        attendance.setAttendanceStatus(isLate ? "Late" : "Present");
        if (request.getRemarks() != null) {
            attendance.setRemarks(request.getRemarks());
        }

        Attendance saved = attendanceRepository.save(attendance);
        return mapper.toAttendanceDto(saved);
    }

    @Override
    @Transactional
    public AttendanceDto checkOut(ClockInRequest request) {
        Long targetEmpId = resolveEmployeeId(request.getEmployeeId());
        LocalDate today = LocalDate.now();

        Attendance attendance = attendanceRepository.findByEmployeeEmployeeIdAndAttendanceDate(targetEmpId, today)
                .orElseThrow(() -> new BadRequestException("Cannot check out without checking in first today"));

        if (attendance.getCheckIn() == null) {
            throw new BadRequestException("Cannot check out without a valid check-in record");
        }

        LocalDateTime checkOutTime = LocalDateTime.now();
        attendance.setCheckOut(checkOutTime);

        // Auto-calculate working hours
        Duration duration = Duration.between(attendance.getCheckIn(), checkOutTime);
        double hours = duration.toMinutes() / 60.0;
        BigDecimal roundedHours = BigDecimal.valueOf(hours).setScale(2, RoundingMode.HALF_UP);
        attendance.setWorkingHours(roundedHours.doubleValue());

        if (attendance.getWorkingHours() > 0 && attendance.getWorkingHours() < 5.0) {
            attendance.setAttendanceStatus("Half-day");
        } else {
            attendance.setAttendanceStatus("Present");
        }

        if (request.getRemarks() != null) {
            attendance.setRemarks(request.getRemarks());
        }

        Attendance saved = attendanceRepository.save(attendance);
        return mapper.toAttendanceDto(saved);
    }

    @Override
    @Transactional
    public AttendanceDto recordManualAttendance(AttendanceDto dto) {
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", dto.getEmployeeId()));

        Attendance attendance = attendanceRepository.findByEmployeeEmployeeIdAndAttendanceDate(dto.getEmployeeId(), dto.getAttendanceDate())
                .orElseGet(() -> Attendance.builder()
                        .employee(employee)
                        .attendanceDate(dto.getAttendanceDate())
                        .build());

        attendance.setCheckIn(dto.getCheckIn());
        attendance.setCheckOut(dto.getCheckOut());
        attendance.setAttendanceStatus(dto.getAttendanceStatus() != null ? dto.getAttendanceStatus() : "Present");
        attendance.setRemarks(dto.getRemarks());

        if (dto.getCheckIn() != null && dto.getCheckOut() != null) {
            Duration duration = Duration.between(dto.getCheckIn(), dto.getCheckOut());
            double hours = duration.toMinutes() / 60.0;
            BigDecimal rounded = BigDecimal.valueOf(hours).setScale(2, RoundingMode.HALF_UP);
            attendance.setWorkingHours(rounded.doubleValue());
        } else if (dto.getWorkingHours() != null) {
            attendance.setWorkingHours(dto.getWorkingHours());
        }

        Attendance saved = attendanceRepository.save(attendance);
        return mapper.toAttendanceDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<AttendanceDto> getAttendanceByEmployee(Long employeeId) {
        Pageable unpaged = org.springframework.data.domain.PageRequest.of(0, 1000, org.springframework.data.domain.Sort.by("attendanceDate").descending());
        return attendanceRepository.filterAttendance(employeeId, null, null, null, null, unpaged)
                .map(mapper::toAttendanceDto)
                .getContent();
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<AttendanceDto> getAttendanceByManager(Long managerId) {
        java.util.List<Employee> reports = employeeRepository.findByManagerEmployeeId(managerId);
        java.util.List<Long> reportIds = reports.stream().map(Employee::getEmployeeId).collect(java.util.stream.Collectors.toList());
        Pageable unpaged = org.springframework.data.domain.PageRequest.of(0, 1000, org.springframework.data.domain.Sort.by("attendanceDate").descending());
        return attendanceRepository.findAll(unpaged).stream()
                .filter(a -> a.getEmployee() != null && reportIds.contains(a.getEmployee().getEmployeeId()))
                .map(mapper::toAttendanceDto)
                .collect(java.util.stream.Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<AttendanceDto> getMyAttendance() {
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
        return getAttendanceByEmployee(empId);
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<AttendanceDto> getTeamAttendance() {
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
        return getAttendanceByManager(empId);
    }

    private Long resolveEmployeeId(Long requestEmployeeId) {
        if (requestEmployeeId != null) {
            return requestEmployeeId;
        }
        Long loggedInEmpId = SecurityUtils.getCurrentEmployeeId();
        if (loggedInEmpId != null) {
            return loggedInEmpId;
        }
        throw new BadRequestException("No employee ID provided and none linked to current user session");
    }
}
