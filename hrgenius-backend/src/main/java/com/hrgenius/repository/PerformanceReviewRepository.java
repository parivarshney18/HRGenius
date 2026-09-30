package com.hrgenius.repository;

import com.hrgenius.entity.PerformanceReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PerformanceReviewRepository extends JpaRepository<PerformanceReview, Long> {

    List<PerformanceReview> findByEmployeeEmployeeId(Long employeeId);

    List<PerformanceReview> findByEmployeeManagerEmployeeId(Long managerId);

    List<PerformanceReview> findByReviewedByEmployeeId(Long reviewerId);

    @Query("SELECT pr FROM PerformanceReview pr WHERE " +
           "(:employeeId IS NULL OR pr.employee.employeeId = :employeeId) AND " +
           "(:reviewPeriod IS NULL OR pr.reviewPeriod = :reviewPeriod) AND " +
           "(:status IS NULL OR pr.performanceStatus = :status) AND " +
           "(:reviewerId IS NULL OR pr.reviewedBy.employeeId = :reviewerId)")
    Page<PerformanceReview> filterPerformanceReviews(
            @Param("employeeId") Long employeeId,
            @Param("reviewPeriod") String reviewPeriod,
            @Param("status") String status,
            @Param("reviewerId") Long reviewerId,
            Pageable pageable
    );

    @Query("SELECT FLOOR(pr.rating), COUNT(pr) FROM PerformanceReview pr WHERE pr.rating IS NOT NULL GROUP BY FLOOR(pr.rating)")
    List<Object[]> getRatingDistribution();

    @Query("SELECT AVG(pr.rating) FROM PerformanceReview pr WHERE pr.rating IS NOT NULL")
    Double getAverageCompanyRating();
}
