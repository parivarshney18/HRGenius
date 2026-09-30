package com.hrgenius.controller;

import com.hrgenius.dto.common.ApiResponse;
import com.hrgenius.dto.common.PageResponse;
import com.hrgenius.dto.leave.LeaveApprovalDto;
import com.hrgenius.dto.leave.LeaveRequestDto;
import com.hrgenius.service.LeaveService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/leaves")
@RequiredArgsConstructor
@Tag(name = "Leaves", description = "Endpoints for employee leave applications, collision validation, and approvals")
public class LeaveController {

    private final LeaveService leaveService;

    @GetMapping
    @Operation(summary = "Get filtered leave requests (returns List when unpaged, PageResponse when page is provided)")
    public ResponseEntity<?> getLeaves(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long managerId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "appliedDate") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        if (page != null) {
            Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
            Pageable pageable = PageRequest.of(page, size, sort);
            return ResponseEntity.ok(leaveService.getLeaves(employeeId, departmentId, managerId, status, pageable));
        }

        Pageable unpaged = PageRequest.of(0, 1000, Sort.by("appliedDate").descending());
        List<LeaveRequestDto> list = leaveService.getLeaves(employeeId, departmentId, managerId, status, unpaged).getContent();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/my")
    @Operation(summary = "Get current logged-in employee leave requests")
    public ResponseEntity<List<LeaveRequestDto>> getMyLeaves() {
        return ResponseEntity.ok(leaveService.getMyLeaves());
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER')")
    @Operation(summary = "Get all pending leave requests for Manager/HR approval")
    public ResponseEntity<List<LeaveRequestDto>> getPendingLeaves() {
        return ResponseEntity.ok(leaveService.getPendingLeaves());
    }

    @GetMapping("/employee/{employeeId}")
    @Operation(summary = "Get leaves by employee ID")
    public ResponseEntity<List<LeaveRequestDto>> getLeavesByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(leaveService.getLeavesByEmployee(employeeId));
    }

    @GetMapping("/manager/{managerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER')")
    @Operation(summary = "Get leaves for team members of a manager")
    public ResponseEntity<List<LeaveRequestDto>> getLeavesByManager(@PathVariable Long managerId) {
        return ResponseEntity.ok(leaveService.getLeavesByManager(managerId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get leave request by ID")
    public ResponseEntity<LeaveRequestDto> getLeaveById(@PathVariable Long id) {
        return ResponseEntity.ok(leaveService.getLeaveById(id));
    }

    @PostMapping
    @Operation(summary = "Apply for leave (auto calculates duration and checks overlapping leaves)")
    public ResponseEntity<LeaveRequestDto> applyLeave(@Valid @RequestBody LeaveRequestDto dto) {
        LeaveRequestDto created = leaveService.applyLeave(dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER')")
    @Operation(summary = "Approve leave request")
    public ResponseEntity<LeaveRequestDto> approveLeave(
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, Object> body) {
        Long approverId = null;
        if (body != null) {
            Object appObj = body.get("approved_by");
            if (appObj == null) appObj = body.get("approvedBy");
            if (appObj instanceof Number num) approverId = num.longValue();
            else if (appObj instanceof String str && !str.isBlank()) {
                try { approverId = Long.parseLong(str); } catch (NumberFormatException ignored) {}
            }
        }
        LeaveRequestDto updated = leaveService.approveLeave(id, approverId);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER')")
    @Operation(summary = "Reject leave request")
    public ResponseEntity<LeaveRequestDto> rejectLeave(
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, Object> body) {
        Long approverId = null;
        if (body != null) {
            Object appObj = body.get("approved_by");
            if (appObj == null) appObj = body.get("approvedBy");
            if (appObj instanceof Number num) approverId = num.longValue();
            else if (appObj instanceof String str && !str.isBlank()) {
                try { approverId = Long.parseLong(str); } catch (NumberFormatException ignored) {}
            }
        }
        LeaveRequestDto updated = leaveService.rejectLeave(id, approverId);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER')")
    @Operation(summary = "Approve or reject leave request via Patch (Manager / HR / Admin)")
    public ResponseEntity<LeaveRequestDto> approveOrRejectLeave(
            @PathVariable Long id,
            @Valid @RequestBody LeaveApprovalDto approvalDto) {
        LeaveRequestDto updated = leaveService.approveOrRejectLeave(id, approvalDto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Cancel or delete a leave request")
    public ResponseEntity<Void> cancelLeave(@PathVariable Long id) {
        leaveService.deleteLeave(id);
        return ResponseEntity.noContent().build();
    }
}
