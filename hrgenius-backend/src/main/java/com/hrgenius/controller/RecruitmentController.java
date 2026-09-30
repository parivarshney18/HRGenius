package com.hrgenius.controller;

import com.hrgenius.dto.common.ApiResponse;
import com.hrgenius.dto.common.PageResponse;
import com.hrgenius.dto.recruitment.CandidateDto;
import com.hrgenius.dto.recruitment.JobDto;
import com.hrgenius.service.RecruitmentService;
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
@RequestMapping("/api/recruitment")
@RequiredArgsConstructor
@Tag(name = "Recruitment", description = "Endpoints for job postings, candidate applications, and interview scheduling")
public class RecruitmentController {

    private final RecruitmentService recruitmentService;

    // --- JOBS ---
    @GetMapping("/jobs")
    @Operation(summary = "Get paginated jobs with search and filter")
    public ResponseEntity<ApiResponse<PageResponse<JobDto>>> getJobs(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "postingDate") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(ApiResponse.success(recruitmentService.getJobs(search, departmentId, status, pageable)));
    }

    @GetMapping("/jobs/open")
    @Operation(summary = "Get list of all open job positions")
    public ResponseEntity<ApiResponse<List<JobDto>>> getOpenJobs() {
        return ResponseEntity.ok(ApiResponse.success(recruitmentService.getOpenJobs()));
    }

    @GetMapping("/jobs/{id}")
    @Operation(summary = "Get job details by ID")
    public ResponseEntity<ApiResponse<JobDto>> getJobById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(recruitmentService.getJobById(id)));
    }

    @PostMapping("/jobs")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Create a job opening (Admin / HR)")
    public ResponseEntity<ApiResponse<JobDto>> createJob(@Valid @RequestBody JobDto jobDto) {
        JobDto created = recruitmentService.createJob(jobDto);
        return new ResponseEntity<>(ApiResponse.success("Job created successfully", created), HttpStatus.CREATED);
    }

    @PutMapping("/jobs/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Update a job opening (Admin / HR)")
    public ResponseEntity<ApiResponse<JobDto>> updateJob(@PathVariable Long id, @Valid @RequestBody JobDto jobDto) {
        JobDto updated = recruitmentService.updateJob(id, jobDto);
        return ResponseEntity.ok(ApiResponse.success("Job updated successfully", updated));
    }

    @DeleteMapping("/jobs/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Close job opening (Admin / HR)")
    public ResponseEntity<ApiResponse<String>> deleteJob(@PathVariable Long id) {
        recruitmentService.deleteJob(id);
        return ResponseEntity.ok(ApiResponse.success("Job closed successfully", "CLOSED"));
    }

    // --- CANDIDATES ---
    @GetMapping("/candidates")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER')")
    @Operation(summary = "Get paginated candidates / applicants")
    public ResponseEntity<ApiResponse<PageResponse<CandidateDto>>> getCandidates(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long jobId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "applicationDate") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(ApiResponse.success(recruitmentService.getCandidates(search, jobId, status, pageable)));
    }

    @GetMapping("/candidates/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER')")
    @Operation(summary = "Get candidate by ID")
    public ResponseEntity<ApiResponse<CandidateDto>> getCandidateById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(recruitmentService.getCandidateById(id)));
    }

    @PostMapping("/candidates")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Submit or register a candidate application")
    public ResponseEntity<ApiResponse<CandidateDto>> applyCandidate(@Valid @RequestBody CandidateDto candidateDto) {
        CandidateDto applied = recruitmentService.applyCandidate(candidateDto);
        return new ResponseEntity<>(ApiResponse.success("Candidate applied successfully", applied), HttpStatus.CREATED);
    }

    @PatchMapping("/candidates/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Update candidate pipeline status (APPLIED, SCREENED, SELECTED, REJECTED)")
    public ResponseEntity<ApiResponse<CandidateDto>> updateStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) String result) {
        CandidateDto updated = recruitmentService.updateCandidateStatus(id, status, result);
        return ResponseEntity.ok(ApiResponse.success("Candidate status updated", updated));
    }

    @PostMapping("/candidates/{id}/interview")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER')")
    @Operation(summary = "Schedule interview for candidate")
    public ResponseEntity<ApiResponse<CandidateDto>> scheduleInterview(
            @PathVariable Long id,
            @RequestBody CandidateDto candidateDto) {
        CandidateDto updated = recruitmentService.scheduleInterview(id, candidateDto);
        return ResponseEntity.ok(ApiResponse.success("Interview scheduled successfully", updated));
    }
}
