package com.hrgenius.service.impl;

import com.hrgenius.dto.common.PageResponse;
import com.hrgenius.dto.performance.PerformanceReviewDto;
import com.hrgenius.entity.Employee;
import com.hrgenius.entity.PerformanceReview;
import com.hrgenius.exception.BadRequestException;
import com.hrgenius.exception.ResourceNotFoundException;
import com.hrgenius.mapper.EntityMapper;
import com.hrgenius.repository.EmployeeRepository;
import com.hrgenius.repository.PerformanceReviewRepository;
import com.hrgenius.security.SecurityUtils;
import com.hrgenius.service.PerformanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PerformanceServiceImpl implements PerformanceService {

    private final PerformanceReviewRepository performanceReviewRepository;
    private final EmployeeRepository employeeRepository;
    private final EntityMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public List<PerformanceReviewDto> getAllReviews(Long employeeId, String reviewPeriod, String status, Long reviewerId) {
        String role = SecurityUtils.getCurrentRole();
        Long currentEmpId = SecurityUtils.getCurrentEmployeeId();

        if ("ROLE_EMPLOYEE".equals(role) && !SecurityUtils.hasAnyRole("ADMIN", "HR", "MANAGER")) {
            employeeId = currentEmpId;
        }

        Page<PerformanceReview> page = performanceReviewRepository.filterPerformanceReviews(
                employeeId, reviewPeriod, status, reviewerId, Pageable.unpaged());
        return page.getContent().stream().map(mapper::toPerformanceReviewDto).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PerformanceReviewDto> getReviews(
            Long employeeId, String reviewPeriod, String status, Long reviewerId, Pageable pageable) {
        String role = SecurityUtils.getCurrentRole();
        Long currentEmpId = SecurityUtils.getCurrentEmployeeId();

        if ("ROLE_EMPLOYEE".equals(role) && !SecurityUtils.hasAnyRole("ADMIN", "HR", "MANAGER")) {
            employeeId = currentEmpId;
        }

        Page<PerformanceReview> page = performanceReviewRepository.filterPerformanceReviews(
                employeeId, reviewPeriod, status, reviewerId, pageable);
        return PageResponse.from(page.map(mapper::toPerformanceReviewDto));
    }

    @Override
    @Transactional(readOnly = true)
    public PerformanceReviewDto getReviewById(Long performanceId) {
        PerformanceReview review = performanceReviewRepository.findById(performanceId)
                .orElseThrow(() -> new ResourceNotFoundException("PerformanceReview", "id", performanceId));
        return mapper.toPerformanceReviewDto(review);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PerformanceReviewDto> getReviewsByEmployee(Long employeeId) {
        return performanceReviewRepository.findByEmployeeEmployeeId(employeeId)
                .stream()
                .map(mapper::toPerformanceReviewDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PerformanceReviewDto> getReviewsByManager(Long managerId) {
        return performanceReviewRepository.findByEmployeeManagerEmployeeId(managerId)
                .stream()
                .map(mapper::toPerformanceReviewDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PerformanceReviewDto> getMyReviews() {
        Long currentEmpId = SecurityUtils.getCurrentEmployeeId();
        if (currentEmpId == null) {
            return List.of();
        }
        return getReviewsByEmployee(currentEmpId);
    }

    @Override
    @Transactional
    public PerformanceReviewDto createReviewGoal(PerformanceReviewDto dto) {
        Long targetEmpId = dto.getEmployeeId();
        if (targetEmpId == null) {
            targetEmpId = SecurityUtils.getCurrentEmployeeId();
        }
        if (targetEmpId == null) {
            throw new BadRequestException("No employee ID associated with the review");
        }

        final Long empId = targetEmpId;
        Employee employee = employeeRepository.findById(empId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", empId));

        Employee reviewer = null;
        Long reviewerId = dto.getReviewedBy() != null ? dto.getReviewedBy() : dto.getReviewedById();
        if (reviewerId != null) {
            reviewer = employeeRepository.findById(reviewerId).orElse(null);
        } else if (employee.getManager() != null) {
            reviewer = employee.getManager();
        }

        String status = (dto.getPerformanceStatus() != null && !dto.getPerformanceStatus().isBlank())
                ? dto.getPerformanceStatus()
                : (dto.getRating() != null && dto.getRating() > 0 ? "Completed" : "In Progress");

        PerformanceReview review = PerformanceReview.builder()
                .employee(employee)
                .reviewPeriod(dto.getReviewPeriod() != null ? dto.getReviewPeriod() : "2026-Q3")
                .goal(dto.getGoal() != null ? dto.getGoal().trim() : "")
                .achievement(dto.getAchievement())
                .rating(dto.getRating())
                .feedback(dto.getFeedback())
                .reviewedBy(reviewer)
                .reviewDate(dto.getReviewDate() != null ? dto.getReviewDate() : LocalDate.now())
                .performanceStatus(status)
                .build();

        PerformanceReview saved = performanceReviewRepository.save(review);
        return mapper.toPerformanceReviewDto(saved);
    }

    @Override
    @Transactional
    public PerformanceReviewDto submitReviewFeedback(Long performanceId, PerformanceReviewDto dto) {
        PerformanceReview review = performanceReviewRepository.findById(performanceId)
                .orElseThrow(() -> new ResourceNotFoundException("PerformanceReview", "id", performanceId));

        Long reviewerEmpId = dto.getReviewedBy() != null ? dto.getReviewedBy() : dto.getReviewedById();
        if (reviewerEmpId == null) {
            reviewerEmpId = SecurityUtils.getCurrentEmployeeId();
        }

        Employee reviewer = null;
        if (reviewerEmpId != null) {
            reviewer = employeeRepository.findById(reviewerEmpId).orElse(null);
        }

        if (dto.getRating() != null) {
            review.setRating(dto.getRating());
        }
        if (dto.getFeedback() != null) {
            review.setFeedback(dto.getFeedback().trim());
        }
        if (dto.getAchievement() != null) {
            review.setAchievement(dto.getAchievement().trim());
        }

        if (reviewer != null) {
            review.setReviewedBy(reviewer);
        }
        review.setReviewDate(dto.getReviewDate() != null ? dto.getReviewDate() : LocalDate.now());
        review.setPerformanceStatus("Completed");

        PerformanceReview updated = performanceReviewRepository.save(review);
        return mapper.toPerformanceReviewDto(updated);
    }

    @Override
    @Transactional
    public PerformanceReviewDto updateReview(Long performanceId, PerformanceReviewDto dto) {
        PerformanceReview review = performanceReviewRepository.findById(performanceId)
                .orElseThrow(() -> new ResourceNotFoundException("PerformanceReview", "id", performanceId));

        if (dto.getGoal() != null && !dto.getGoal().isBlank()) {
            review.setGoal(dto.getGoal().trim());
        }
        if (dto.getAchievement() != null) {
            review.setAchievement(dto.getAchievement().trim());
        }
        if (dto.getRating() != null) {
            review.setRating(dto.getRating());
        }
        if (dto.getFeedback() != null) {
            review.setFeedback(dto.getFeedback().trim());
        }
        if (dto.getReviewPeriod() != null) {
            review.setReviewPeriod(dto.getReviewPeriod());
        }
        if (dto.getPerformanceStatus() != null) {
            review.setPerformanceStatus(dto.getPerformanceStatus());
        }
        if (dto.getReviewDate() != null) {
            review.setReviewDate(dto.getReviewDate());
        }

        Long reviewerId = dto.getReviewedBy() != null ? dto.getReviewedBy() : dto.getReviewedById();
        if (reviewerId != null) {
            Employee reviewer = employeeRepository.findById(reviewerId).orElse(null);
            review.setReviewedBy(reviewer);
        }

        PerformanceReview updated = performanceReviewRepository.save(review);
        return mapper.toPerformanceReviewDto(updated);
    }

    @Override
    @Transactional
    public PerformanceReviewDto updateReviewStatus(Long performanceId, String status) {
        PerformanceReview review = performanceReviewRepository.findById(performanceId)
                .orElseThrow(() -> new ResourceNotFoundException("PerformanceReview", "id", performanceId));

        review.setPerformanceStatus(status);
        PerformanceReview updated = performanceReviewRepository.save(review);
        return mapper.toPerformanceReviewDto(updated);
    }

    @Override
    @Transactional
    public void deleteReview(Long performanceId) {
        PerformanceReview review = performanceReviewRepository.findById(performanceId)
                .orElseThrow(() -> new ResourceNotFoundException("PerformanceReview", "id", performanceId));
        performanceReviewRepository.delete(review);
    }
}
