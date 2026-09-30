package com.hrgenius.controller;

import com.hrgenius.dto.recruitment.CandidateDto;
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
import java.util.Map;

@RestController
@RequestMapping("/api/candidates")
@RequiredArgsConstructor
@Tag(name = "Candidates", description = "Endpoints for candidate pipeline and applicant tracking")
public class CandidateController {

    private final RecruitmentService recruitmentService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Get candidates with optional pagination, job filter, and search")
    public ResponseEntity<?> getCandidates(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long jobId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "applicationDate") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        if (page != null) {
            Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
            Pageable pageable = PageRequest.of(page, size, sort);
            return ResponseEntity.ok(recruitmentService.getCandidates(search, jobId, status, pageable));
        }

        Pageable unpaged = PageRequest.of(0, 1000, Sort.by("applicationDate").descending());
        List<CandidateDto> candidates = recruitmentService.getCandidates(search, jobId, status, unpaged).getContent();
        return ResponseEntity.ok(candidates);
    }

    @GetMapping("/job/{jobId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Get all candidates for a specific job opening")
    public ResponseEntity<List<CandidateDto>> getCandidatesByJob(@PathVariable Long jobId) {
        Pageable unpaged = PageRequest.of(0, 1000, Sort.by("applicationDate").descending());
        List<CandidateDto> candidates = recruitmentService.getCandidates(null, jobId, null, unpaged).getContent();
        return ResponseEntity.ok(candidates);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Get candidate details by ID")
    public ResponseEntity<CandidateDto> getCandidateById(@PathVariable Long id) {
        return ResponseEntity.ok(recruitmentService.getCandidateById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Apply / submit new candidate profile")
    public ResponseEntity<CandidateDto> applyCandidate(@Valid @RequestBody CandidateDto candidateDto) {
        CandidateDto created = recruitmentService.applyCandidate(candidateDto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Update candidate details")
    public ResponseEntity<CandidateDto> updateCandidate(@PathVariable Long id, @RequestBody CandidateDto candidateDto) {
        CandidateDto updated = recruitmentService.updateCandidate(id, candidateDto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Delete candidate")
    public ResponseEntity<Void> deleteCandidate(@PathVariable Long id) {
        recruitmentService.deleteCandidate(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Update candidate pipeline status and interview result")
    public ResponseEntity<CandidateDto> updateCandidateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        String status = (String) body.get("application_status");
        if (status == null) {
            status = (String) body.get("status");
        }
        String interviewResult = (String) body.get("interview_result");
        CandidateDto candidateUpdate = new CandidateDto();
        candidateUpdate.setApplicationStatus(status);
        candidateUpdate.setInterviewResult(interviewResult);
        if (body.containsKey("interview_date")) {
            candidateUpdate.setInterviewDateFromAny(body.get("interview_date"));
        }
        CandidateDto updated = recruitmentService.updateCandidate(id, candidateUpdate);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Patch candidate pipeline status and interview result")
    public ResponseEntity<CandidateDto> patchCandidateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        return updateCandidateStatus(id, body);
    }
}
