package com.hrgenius.service;

import com.hrgenius.dto.common.PageResponse;
import com.hrgenius.dto.recruitment.CandidateDto;
import com.hrgenius.dto.recruitment.JobDto;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface RecruitmentService {
    // Jobs
    PageResponse<JobDto> getJobs(String search, Long departmentId, String status, Pageable pageable);
    List<JobDto> getOpenJobs();
    JobDto getJobById(Long jobId);
    JobDto createJob(JobDto jobDto);
    JobDto updateJob(Long jobId, JobDto jobDto);
    void deleteJob(Long jobId);

    // Candidates
    PageResponse<CandidateDto> getCandidates(String search, Long jobId, String status, Pageable pageable);
    CandidateDto getCandidateById(Long candidateId);
    CandidateDto applyCandidate(CandidateDto candidateDto);
    CandidateDto updateCandidateStatus(Long candidateId, String status, String interviewResult);
    CandidateDto updateCandidate(Long candidateId, CandidateDto candidateDto);
    void deleteCandidate(Long candidateId);
    CandidateDto scheduleInterview(Long candidateId, CandidateDto candidateDto);
}
