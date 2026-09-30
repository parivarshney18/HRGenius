package com.hrgenius.service;

import com.hrgenius.dto.common.PageResponse;
import com.hrgenius.dto.performance.PerformanceReviewDto;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PerformanceService {
    List<PerformanceReviewDto> getAllReviews(Long employeeId, String reviewPeriod, String status, Long reviewerId);
    PageResponse<PerformanceReviewDto> getReviews(Long employeeId, String reviewPeriod, String status, Long reviewerId, Pageable pageable);
    PerformanceReviewDto getReviewById(Long performanceId);
    List<PerformanceReviewDto> getReviewsByEmployee(Long employeeId);
    List<PerformanceReviewDto> getReviewsByManager(Long managerId);
    List<PerformanceReviewDto> getMyReviews();
    PerformanceReviewDto createReviewGoal(PerformanceReviewDto dto);
    PerformanceReviewDto submitReviewFeedback(Long performanceId, PerformanceReviewDto dto);
    PerformanceReviewDto updateReview(Long performanceId, PerformanceReviewDto dto);
    PerformanceReviewDto updateReviewStatus(Long performanceId, String status);
    void deleteReview(Long performanceId);
}
