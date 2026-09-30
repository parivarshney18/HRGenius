package com.hrgenius.controller;

import com.hrgenius.dto.performance.PerformanceReviewDto;
import com.hrgenius.service.PerformanceService;
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
@RequestMapping("/api/performance")
@RequiredArgsConstructor
@Tag(name = "Performance", description = "Endpoints for employee goals, appraisal reviews, and manager ratings")
public class PerformanceController {

    private final PerformanceService performanceService;

    @GetMapping
    @Operation(summary = "Get performance reviews (all or paginated)")
    public ResponseEntity<?> getReviews(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String reviewPeriod,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long reviewerId,
            @RequestParam(required = false) Integer page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "performanceId") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        if (page == null) {
            List<PerformanceReviewDto> list = performanceService.getAllReviews(employeeId, reviewPeriod, status, reviewerId);
            return ResponseEntity.ok(list);
        }

        Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(performanceService.getReviews(employeeId, reviewPeriod, status, reviewerId, pageable));
    }

    @GetMapping("/my")
    @Operation(summary = "Get current authenticated employee's performance reviews")
    public ResponseEntity<List<PerformanceReviewDto>> getMyReviews() {
        return ResponseEntity.ok(performanceService.getMyReviews());
    }

    @GetMapping("/employee/{employeeId}")
    @Operation(summary = "Get performance reviews by employee ID")
    public ResponseEntity<List<PerformanceReviewDto>> getReviewsByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(performanceService.getReviewsByEmployee(employeeId));
    }

    @GetMapping("/manager/{managerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER')")
    @Operation(summary = "Get performance reviews for direct reports of a manager")
    public ResponseEntity<List<PerformanceReviewDto>> getReviewsByManager(@PathVariable Long managerId) {
        return ResponseEntity.ok(performanceService.getReviewsByManager(managerId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get performance review by ID")
    public ResponseEntity<PerformanceReviewDto> getReviewById(@PathVariable Long id) {
        return ResponseEntity.ok(performanceService.getReviewById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Create performance goal / review")
    public ResponseEntity<PerformanceReviewDto> createReview(@Valid @RequestBody PerformanceReviewDto dto) {
        PerformanceReviewDto created = performanceService.createReviewGoal(dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER')")
    @Operation(summary = "Submit manager review feedback and score rating (1-5)")
    public ResponseEntity<PerformanceReviewDto> submitReview(
            @PathVariable Long id,
            @RequestBody PerformanceReviewDto dto) {
        PerformanceReviewDto updated = performanceService.submitReviewFeedback(id, dto);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Update performance record")
    public ResponseEntity<PerformanceReviewDto> updateReview(
            @PathVariable Long id,
            @RequestBody PerformanceReviewDto dto) {
        PerformanceReviewDto updated = performanceService.updateReview(id, dto);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER')")
    @Operation(summary = "Update review lifecycle status (SUBMITTED, REVIEWED, ACKNOWLEDGED)")
    public ResponseEntity<PerformanceReviewDto> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        PerformanceReviewDto updated = performanceService.updateReviewStatus(id, status);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Delete performance record")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id) {
        performanceService.deleteReview(id);
        return ResponseEntity.noContent().build();
    }
}
