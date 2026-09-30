package com.hrgenius.service;

import com.hrgenius.dto.common.PageResponse;
import com.hrgenius.dto.employee.EmployeeResponse;
import com.hrgenius.dto.onboarding.ConvertCandidateRequest;
import com.hrgenius.dto.onboarding.OnboardingDto;
import org.springframework.data.domain.Pageable;

public interface OnboardingService {
    PageResponse<OnboardingDto> getOnboardingList(String search, String status, Pageable pageable);
    OnboardingDto getOnboardingById(Long onboardingId);
    OnboardingDto getOnboardingByCandidateId(Long candidateId);
    OnboardingDto updateOnboarding(Long onboardingId, OnboardingDto dto);
    EmployeeResponse convertCandidateToEmployee(ConvertCandidateRequest request);
    java.util.Map<String, Object> completeOnboarding(Long onboardingId, java.util.Map<String, Object> payload);
}
