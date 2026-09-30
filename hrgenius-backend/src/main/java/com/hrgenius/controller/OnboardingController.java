package com.hrgenius.controller;

import com.hrgenius.dto.common.ApiResponse;
import com.hrgenius.dto.common.PageResponse;
import com.hrgenius.dto.employee.EmployeeResponse;
import com.hrgenius.dto.onboarding.ConvertCandidateRequest;
import com.hrgenius.dto.onboarding.OnboardingDto;
import com.hrgenius.service.OnboardingService;
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
@RequestMapping("/api/onboarding")
@RequiredArgsConstructor
@Tag(name = "Onboarding", description = "Endpoints for employee onboarding, verification, and candidate-to-employee conversion")
public class OnboardingController {

    private final OnboardingService onboardingService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER')")
    @Operation(summary = "Get list of onboarding cases (returns List when unpaged, PageResponse when page is provided)")
    public ResponseEntity<?> getOnboardingList(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "joiningDate") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {

        if (page != null) {
            Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
            Pageable pageable = PageRequest.of(page, size, sort);
            return ResponseEntity.ok(onboardingService.getOnboardingList(search, status, pageable));
        }

        Pageable unpaged = PageRequest.of(0, 1000, Sort.by("joiningDate").ascending());
        List<OnboardingDto> list = onboardingService.getOnboardingList(search, status, unpaged).getContent();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get onboarding details by ID")
    public ResponseEntity<OnboardingDto> getOnboardingById(@PathVariable Long id) {
        return ResponseEntity.ok(onboardingService.getOnboardingById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Update onboarding checklist and status (Admin / HR)")
    public ResponseEntity<OnboardingDto> updateOnboarding(
            @PathVariable Long id,
            @RequestBody OnboardingDto dto) {
        return ResponseEntity.ok(onboardingService.updateOnboarding(id, dto));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Complete onboarding for candidate, create Employee record and User account")
    public ResponseEntity<java.util.Map<String, Object>> completeOnboarding(
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, Object> payload) {
        java.util.Map<String, Object> result = onboardingService.completeOnboarding(id, payload);
        return new ResponseEntity<>(result, HttpStatus.CREATED);
    }

    @PostMapping("/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Complete onboarding payload from frontend")
    public ResponseEntity<java.util.Map<String, Object>> completeOnboardingPayload(
            @RequestBody java.util.Map<String, Object> payload) {
        Long onboardingId = null;
        if (payload != null) {
            Object idVal = payload.get("onboarding_id");
            if (idVal == null) idVal = payload.get("onboardingId");
            if (idVal instanceof Number num) {
                onboardingId = num.longValue();
            } else if (idVal instanceof String str) {
                onboardingId = Long.parseLong(str);
            }
        }
        if (onboardingId == null) {
            throw new IllegalArgumentException("onboarding_id is required in request body");
        }
        java.util.Map<String, Object> result = onboardingService.completeOnboarding(onboardingId, payload);
        return new ResponseEntity<>(result, HttpStatus.CREATED);
    }

    @PostMapping("/convert")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Convert selected candidate to Employee and automatically provision a User account")
    public ResponseEntity<EmployeeResponse> convertCandidate(@Valid @RequestBody ConvertCandidateRequest request) {
        EmployeeResponse employee = onboardingService.convertCandidateToEmployee(request);
        return new ResponseEntity<>(employee, HttpStatus.CREATED);
    }
}
