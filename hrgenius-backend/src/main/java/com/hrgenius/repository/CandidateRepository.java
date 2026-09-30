package com.hrgenius.repository;

import com.hrgenius.entity.Candidate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, Long> {
    List<Candidate> findByJobJobId(Long jobId);
    List<Candidate> findByApplicationStatus(String applicationStatus);

    @Query("SELECT c FROM Candidate c WHERE " +
           "(:jobId IS NULL OR c.job.jobId = :jobId) AND " +
           "(:status IS NULL OR c.applicationStatus = :status) AND " +
           "(:search IS NULL OR LOWER(c.candidateName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(c.candidateEmail) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Candidate> searchCandidates(
            @Param("search") String search,
            @Param("jobId") Long jobId,
            @Param("status") String status,
            Pageable pageable
    );

    @Query("SELECT c.applicationStatus, COUNT(c) FROM Candidate c GROUP BY c.applicationStatus")
    List<Object[]> countCandidatesByStatus();
}
