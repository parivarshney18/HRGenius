package com.hrgenius.controller;

import com.hrgenius.dto.profile.UserProfileDto;
import com.hrgenius.security.SecurityUtils;
import com.hrgenius.service.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@Tag(name = "Profile", description = "Endpoints for employee personal profile, employment details, and salary history")
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/me")
    @Operation(summary = "Get currently authenticated user's profile, employment details, and salary history")
    public ResponseEntity<UserProfileDto> getMyProfile() {
        return ResponseEntity.ok(profileService.getCurrentUserProfile());
    }

    @GetMapping
    @Operation(summary = "Get currently authenticated user's profile (alias for /me)")
    public ResponseEntity<UserProfileDto> getDefaultProfile() {
        return ResponseEntity.ok(profileService.getCurrentUserProfile());
    }

    @GetMapping("/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get employee profile by ID (Admin, HR, or own profile)")
    public ResponseEntity<UserProfileDto> getProfileByEmployeeId(@PathVariable Long employeeId) {
        Long currentEmpId = SecurityUtils.getCurrentEmployeeId();
        if ("ROLE_EMPLOYEE".equals(SecurityUtils.getCurrentRole()) && !SecurityUtils.hasAnyRole("ADMIN", "HR", "MANAGER")) {
            if (currentEmpId != null && !currentEmpId.equals(employeeId)) {
                return ResponseEntity.ok(profileService.getCurrentUserProfile());
            }
        }
        return ResponseEntity.ok(profileService.getProfileByEmployeeId(employeeId));
    }
}
