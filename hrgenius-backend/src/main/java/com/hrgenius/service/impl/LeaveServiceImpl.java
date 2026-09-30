package com.hrgenius.service.impl;

import com.hrgenius.dto.common.PageResponse;
import com.hrgenius.dto.leave.LeaveApprovalDto;
import com.hrgenius.dto.leave.LeaveRequestDto;
import com.hrgenius.entity.Employee;
import com.hrgenius.entity.LeaveRequest;
import com.hrgenius.exception.BadRequestException;
import com.hrgenius.exception.ResourceNotFoundException;
import com.hrgenius.exception.UnauthorizedException;
import com.hrgenius.mapper.EntityMapper;
import com.hrgenius.repository.EmployeeRepository;
import com.hrgenius.repository.LeaveRequestRepository;
import com.hrgenius.security.SecurityUtils;
import com.hrgenius.service.LeaveService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LeaveServiceImpl implements LeaveService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final EmployeeRepository employeeRepository;
    private final EntityMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<LeaveRequestDto> getLeaves(Long employeeId, Long departmentId, Long managerId, String status, Pageable pageable) {
        Page<LeaveRequest> page = leaveRequestRepository.filterLeaveRequests(employeeId, departmentId, managerId, status, pageable);
        return PageResponse.from(page.map(mapper::toLeaveRequestDto));
    }

    @Override
    @Transactional(readOnly = true)
    public LeaveRequestDto getLeaveById(Long leaveId) {
        LeaveRequest leave = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("LeaveRequest", "id", leaveId));
        return mapper.toLeaveRequestDto(leave);
    }

    @Override
    @Transactional
    public LeaveRequestDto applyLeave(LeaveRequestDto dto) {
        Long targetEmpId = dto.getEmployeeId();
        if (targetEmpId == null) {
            targetEmpId = SecurityUtils.getCurrentEmployeeId();
        }
        if (targetEmpId == null) {
            throw new BadRequestException("No employee ID associated with the leave application");
        }

        final Long empId = targetEmpId;
        Employee employee = employeeRepository.findById(empId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", empId));

        if (dto.getStartDate().isAfter(dto.getEndDate())) {
            throw new BadRequestException("Leave start date cannot be after end date");
        }

        // VALIDATION: Check for overlapping leaves
        List<LeaveRequest> overlaps = leaveRequestRepository.findOverlappingLeaves(
                targetEmpId,
                dto.getStartDate(),
                dto.getEndDate(),
                dto.getLeaveId()
        );

        if (!overlaps.isEmpty()) {
            LeaveRequest conflict = overlaps.get(0);
            throw new BadRequestException(String.format(
                    "Employee already has an overlapping leave (%s) from %s to %s with status %s",
                    conflict.getLeaveType(),
                    conflict.getStartDate(),
                    conflict.getEndDate(),
                    conflict.getLeaveStatus()
            ));
        }

        // Auto-calculate number of days
        double days = (double) (ChronoUnit.DAYS.between(dto.getStartDate(), dto.getEndDate()) + 1);

        LeaveRequest leave = LeaveRequest.builder()
                .employee(employee)
                .leaveType(dto.getLeaveType())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .numberOfDays(days)
                .reason(dto.getReason().trim())
                .appliedDate(LocalDate.now())
                .leaveStatus("PENDING")
                .build();

        LeaveRequest saved = leaveRequestRepository.save(leave);
        return mapper.toLeaveRequestDto(saved);
    }

    @Override
    @Transactional
    public LeaveRequestDto approveOrRejectLeave(Long leaveId, LeaveApprovalDto approvalDto) {
        LeaveRequest leave = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("LeaveRequest", "id", leaveId));

        String targetStatus = approvalDto.getStatus().trim().toUpperCase();
        if (!"APPROVED".equals(targetStatus) && !"REJECTED".equals(targetStatus)) {
            throw new BadRequestException("Invalid status: Must be APPROVED or REJECTED");
        }

        Long approverEmpId = SecurityUtils.getCurrentEmployeeId();
        Employee approver = null;
        if (approverEmpId != null) {
            approver = employeeRepository.findById(approverEmpId).orElse(null);
        }

        leave.setLeaveStatus(targetStatus);
        leave.setApprovedBy(approver);
        leave.setApprovalDate(LocalDate.now());

        LeaveRequest updated = leaveRequestRepository.save(leave);
        return mapper.toLeaveRequestDto(updated);
    }

    @Override
    @Transactional
    public void cancelLeave(Long leaveId) {
        LeaveRequest leave = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("LeaveRequest", "id", leaveId));

        Long currentEmpId = SecurityUtils.getCurrentEmployeeId();
        String currentRole = SecurityUtils.getCurrentRole();

        boolean isOwner = currentEmpId != null && currentEmpId.equals(leave.getEmployee().getEmployeeId());
        boolean isAdminOrHr = "ROLE_ADMIN".equals(currentRole) || "ROLE_HR".equals(currentRole);

        if (!isOwner && !isAdminOrHr) {
            throw new UnauthorizedException("You are not authorized to cancel this leave");
        }

        if ("APPROVED".equals(leave.getLeaveStatus()) && !isAdminOrHr) {
            throw new BadRequestException("Already approved leave can only be cancelled by HR or Admin");
        }

        leave.setLeaveStatus("CANCELLED");
        leaveRequestRepository.save(leave);
    }

    @Override
    @Transactional
    public LeaveRequestDto approveLeave(Long leaveId, Long approverId) {
        LeaveRequest leave = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("LeaveRequest", "id", leaveId));

        Employee approver = null;
        if (approverId != null) {
            approver = employeeRepository.findById(approverId).orElse(null);
        }
        if (approver == null) {
            Long currentEmpId = SecurityUtils.getCurrentEmployeeId();
            if (currentEmpId != null) {
                approver = employeeRepository.findById(currentEmpId).orElse(null);
            }
        }

        leave.setLeaveStatus("APPROVED");
        leave.setApprovedBy(approver);
        leave.setApprovalDate(LocalDate.now());

        LeaveRequest updated = leaveRequestRepository.save(leave);
        return mapper.toLeaveRequestDto(updated);
    }

    @Override
    @Transactional
    public LeaveRequestDto rejectLeave(Long leaveId, Long approverId) {
        LeaveRequest leave = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("LeaveRequest", "id", leaveId));

        Employee approver = null;
        if (approverId != null) {
            approver = employeeRepository.findById(approverId).orElse(null);
        }
        if (approver == null) {
            Long currentEmpId = SecurityUtils.getCurrentEmployeeId();
            if (currentEmpId != null) {
                approver = employeeRepository.findById(currentEmpId).orElse(null);
            }
        }

        leave.setLeaveStatus("REJECTED");
        leave.setApprovedBy(approver);
        leave.setApprovalDate(LocalDate.now());

        LeaveRequest updated = leaveRequestRepository.save(leave);
        return mapper.toLeaveRequestDto(updated);
    }

    @Override
    @Transactional
    public void deleteLeave(Long leaveId) {
        LeaveRequest leave = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("LeaveRequest", "id", leaveId));
        leaveRequestRepository.delete(leave);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LeaveRequestDto> getLeavesByEmployee(Long employeeId) {
        return leaveRequestRepository.findByEmployeeEmployeeId(employeeId).stream()
                .map(mapper::toLeaveRequestDto)
                .collect(java.util.stream.Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<LeaveRequestDto> getPendingLeaves() {
        return leaveRequestRepository.findByLeaveStatus("PENDING").stream()
                .map(mapper::toLeaveRequestDto)
                .collect(java.util.stream.Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<LeaveRequestDto> getLeavesByManager(Long managerId) {
        List<Employee> reports = employeeRepository.findByManagerEmployeeId(managerId);
        List<Long> reportIds = reports.stream().map(Employee::getEmployeeId).collect(java.util.stream.Collectors.toList());
        return leaveRequestRepository.findAll().stream()
                .filter(l -> l.getEmployee() != null && reportIds.contains(l.getEmployee().getEmployeeId()))
                .map(mapper::toLeaveRequestDto)
                .collect(java.util.stream.Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<LeaveRequestDto> getMyLeaves() {
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
        return getLeavesByEmployee(empId);
    }
}
