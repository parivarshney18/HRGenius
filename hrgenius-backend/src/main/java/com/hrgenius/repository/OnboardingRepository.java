package com.hrgenius.repository;

import com.hrgenius.entity.Onboarding;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OnboardingRepository extends JpaRepository<Onboarding, Long> {
    Optional<Onboarding> findByCandidateCandidateId(Long candidateId);
    Optional<Onboarding> findByEmployeeEmployeeId(Long employeeId);

    @Query("SELECT o FROM Onboarding o WHERE " +
           "(:status IS NULL OR o.onboardingStatus = :status) AND " +
           "(:search IS NULL OR LOWER(o.candidate.candidateName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Onboarding> searchOnboarding(@Param("search") String search, @Param("status") String status, Pageable pageable);
}
