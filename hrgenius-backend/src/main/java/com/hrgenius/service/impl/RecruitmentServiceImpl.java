package com.hrgenius.service.impl;

import com.hrgenius.dto.common.PageResponse;
import com.hrgenius.dto.recruitment.CandidateDto;
import com.hrgenius.dto.recruitment.JobDto;
import com.hrgenius.entity.Candidate;
import com.hrgenius.entity.Department;
import com.hrgenius.entity.Job;
import com.hrgenius.entity.Onboarding;
import com.hrgenius.exception.ResourceNotFoundException;
import com.hrgenius.mapper.EntityMapper;
import com.hrgenius.repository.CandidateRepository;
import com.hrgenius.repository.DepartmentRepository;
import com.hrgenius.repository.JobRepository;
import com.hrgenius.repository.OnboardingRepository;
import com.hrgenius.service.RecruitmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecruitmentServiceImpl implements RecruitmentService {

    private final JobRepository jobRepository;
    private final CandidateRepository candidateRepository;
    private final DepartmentRepository departmentRepository;
    private final OnboardingRepository onboardingRepository;
    private final EntityMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<JobDto> getJobs(String search, Long departmentId, String status, Pageable pageable) {
        Page<Job> page = jobRepository.searchJobs(search, departmentId, status, pageable);
        return PageResponse.from(page.map(job -> {
            long applicants = candidateRepository.findByJobJobId(job.getJobId()).size();
            return mapper.toJobDto(job, applicants);
        }));
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobDto> getOpenJobs() {
        return jobRepository.findByStatus("OPEN").stream()
                .map(j -> mapper.toJobDto(j, (long) candidateRepository.findByJobJobId(j.getJobId()).size()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public JobDto getJobById(Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job", "id", jobId));
        long applicants = candidateRepository.findByJobJobId(job.getJobId()).size();
        return mapper.toJobDto(job, applicants);
    }

    @Override
    @Transactional
    public JobDto createJob(JobDto jobDto) {
        Department dept = departmentRepository.findById(jobDto.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", jobDto.getDepartmentId()));

        Job job = Job.builder()
                .jobTitle(jobDto.getJobTitle().trim())
                .department(dept)
                .description(jobDto.getDescription())
                .requirements(jobDto.getRequirements())
                .openings(jobDto.getOpenings() != null ? jobDto.getOpenings() : 1)
                .postingDate(jobDto.getPostingDate() != null ? jobDto.getPostingDate() : LocalDate.now())
                .closingDate(jobDto.getClosingDate())
                .status(jobDto.getStatus() != null ? jobDto.getStatus() : "OPEN")
                .build();

        Job saved = jobRepository.save(job);
        return mapper.toJobDto(saved, 0L);
    }

    @Override
    @Transactional
    public JobDto updateJob(Long jobId, JobDto jobDto) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job", "id", jobId));

        Department dept = departmentRepository.findById(jobDto.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", jobDto.getDepartmentId()));

        job.setJobTitle(jobDto.getJobTitle().trim());
        job.setDepartment(dept);
        job.setDescription(jobDto.getDescription());
        job.setRequirements(jobDto.getRequirements());
        if (jobDto.getOpenings() != null) job.setOpenings(jobDto.getOpenings());
        if (jobDto.getClosingDate() != null) job.setClosingDate(jobDto.getClosingDate());
        if (jobDto.getStatus() != null) job.setStatus(jobDto.getStatus());

        Job updated = jobRepository.save(job);
        long applicants = candidateRepository.findByJobJobId(updated.getJobId()).size();
        return mapper.toJobDto(updated, applicants);
    }

    @Override
    @Transactional
    public void deleteJob(Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job", "id", jobId));
        job.setStatus("CLOSED");
        jobRepository.save(job);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CandidateDto> getCandidates(String search, Long jobId, String status, Pageable pageable) {
        Page<Candidate> page = candidateRepository.searchCandidates(search, jobId, status, pageable);
        return PageResponse.from(page.map(c -> {
            Long onbId = onboardingRepository.findByCandidateCandidateId(c.getCandidateId())
                    .map(Onboarding::getOnboardingId)
                    .orElse(null);
            return mapper.toCandidateDto(c, onbId);
        }));
    }

    @Override
    @Transactional(readOnly = true)
    public CandidateDto getCandidateById(Long candidateId) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate", "id", candidateId));
        Long onbId = onboardingRepository.findByCandidateCandidateId(candidate.getCandidateId())
                .map(Onboarding::getOnboardingId)
                .orElse(null);
        return mapper.toCandidateDto(candidate, onbId);
    }

    @Override
    @Transactional
    public CandidateDto applyCandidate(CandidateDto candidateDto) {
        Job job = jobRepository.findById(candidateDto.getJobId())
                .orElseThrow(() -> new ResourceNotFoundException("Job", "id", candidateDto.getJobId()));

        Candidate candidate = Candidate.builder()
                .job(job)
                .candidateName(candidateDto.getCandidateName().trim())
                .candidateEmail(candidateDto.getCandidateEmail().trim())
                .phone(candidateDto.getPhone())
                .resumeUrl(candidateDto.getResumeUrl())
                .applicationDate(LocalDate.now())
                .applicationStatus("APPLIED")
                .build();

        Candidate saved = candidateRepository.save(candidate);
        return mapper.toCandidateDto(saved, null);
    }

    @Override
    @Transactional
    public CandidateDto updateCandidateStatus(Long candidateId, String status, String interviewResult) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate", "id", candidateId));

        candidate.setApplicationStatus(status);
        if (interviewResult != null) {
            candidate.setInterviewResult(interviewResult);
        }

        Candidate updated = candidateRepository.save(candidate);

        // If candidate is SELECTED, automatically initialize an Onboarding record if one doesn't exist
        if ("SELECTED".equalsIgnoreCase(status)) {
            onboardingRepository.findByCandidateCandidateId(candidateId).orElseGet(() -> {
                Onboarding onb = Onboarding.builder()
                        .candidate(updated)
                        .joiningDate(LocalDate.now().plusWeeks(2))
                        .documentStatus("PENDING")
                        .verificationStatus("PENDING")
                        .assignedDepartment(updated.getJob().getDepartment())
                        .onboardingStatus("IN_PROGRESS")
                        .build();
                return onboardingRepository.save(onb);
            });
        }

        Long onbId = onboardingRepository.findByCandidateCandidateId(updated.getCandidateId())
                .map(Onboarding::getOnboardingId)
                .orElse(null);

        return mapper.toCandidateDto(updated, onbId);
    }

    @Override
    @Transactional
    public CandidateDto scheduleInterview(Long candidateId, CandidateDto candidateDto) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate", "id", candidateId));

        candidate.setApplicationStatus("INTERVIEW_SCHEDULED");
        candidate.setInterviewDate(candidateDto.getInterviewDate());
        if (candidateDto.getInterviewResult() != null) {
            candidate.setInterviewResult(candidateDto.getInterviewResult());
        }

        Candidate updated = candidateRepository.save(candidate);
        Long onbId = onboardingRepository.findByCandidateCandidateId(updated.getCandidateId())
                .map(Onboarding::getOnboardingId)
                .orElse(null);

        return mapper.toCandidateDto(updated, onbId);
    }

    @Override
    @Transactional
    public CandidateDto updateCandidate(Long candidateId, CandidateDto candidateDto) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate", "id", candidateId));

        if (candidateDto.getCandidateName() != null && !candidateDto.getCandidateName().isBlank()) {
            candidate.setCandidateName(candidateDto.getCandidateName().trim());
        }
        if (candidateDto.getCandidateEmail() != null && !candidateDto.getCandidateEmail().isBlank()) {
            candidate.setCandidateEmail(candidateDto.getCandidateEmail().trim());
        }
        if (candidateDto.getPhone() != null) {
            candidate.setPhone(candidateDto.getPhone());
        }
        if (candidateDto.getResume() != null) {
            candidate.setResumeUrl(candidateDto.getResume());
        }
        if (candidateDto.getApplicationStatus() != null) {
            candidate.setApplicationStatus(candidateDto.getApplicationStatus());
            if ("SELECTED".equalsIgnoreCase(candidateDto.getApplicationStatus())) {
                onboardingRepository.findByCandidateCandidateId(candidateId).orElseGet(() -> {
                    Onboarding onb = Onboarding.builder()
                            .candidate(candidate)
                            .joiningDate(LocalDate.now().plusWeeks(2))
                            .documentStatus("PENDING")
                            .verificationStatus("PENDING")
                            .assignedDepartment(candidate.getJob().getDepartment())
                            .onboardingStatus("IN_PROGRESS")
                            .build();
                    return onboardingRepository.save(onb);
                });
            }
        }
        if (candidateDto.getInterviewDate() != null) {
            candidate.setInterviewDate(candidateDto.getInterviewDate());
        }
        if (candidateDto.getInterviewResult() != null) {
            candidate.setInterviewResult(candidateDto.getInterviewResult());
        }

        Candidate updated = candidateRepository.save(candidate);
        Long onbId = onboardingRepository.findByCandidateCandidateId(updated.getCandidateId())
                .map(Onboarding::getOnboardingId)
                .orElse(null);
        return mapper.toCandidateDto(updated, onbId);
    }

    @Override
    @Transactional
    public void deleteCandidate(Long candidateId) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate", "id", candidateId));
        candidateRepository.delete(candidate);
    }
}
