package com.hrgenius.service;

import com.hrgenius.dto.common.PageResponse;
import com.hrgenius.dto.leave.LeaveApprovalDto;
import com.hrgenius.dto.leave.LeaveRequestDto;
import org.springframework.data.domain.Pageable;

public interface LeaveService {
    PageResponse<LeaveRequestDto> getLeaves(Long employeeId, Long departmentId, Long managerId, String status, Pageable pageable);
    LeaveRequestDto getLeaveById(Long leaveId);
    LeaveRequestDto applyLeave(LeaveRequestDto dto);
    LeaveRequestDto approveOrRejectLeave(Long leaveId, LeaveApprovalDto approvalDto);
    LeaveRequestDto approveLeave(Long leaveId, Long approverId);
    LeaveRequestDto rejectLeave(Long leaveId, Long approverId);
    void cancelLeave(Long leaveId);
    void deleteLeave(Long leaveId);
    java.util.List<LeaveRequestDto> getLeavesByEmployee(Long employeeId);
    java.util.List<LeaveRequestDto> getPendingLeaves();
    java.util.List<LeaveRequestDto> getLeavesByManager(Long managerId);
    java.util.List<LeaveRequestDto> getMyLeaves();
}
