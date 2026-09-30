package com.hrgenius.repository;

import com.hrgenius.entity.Job;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {
    List<Job> findByStatus(String status);
    List<Job> findByDepartmentDepartmentId(Long departmentId);

    @Query("SELECT j FROM Job j WHERE " +
           "(:departmentId IS NULL OR j.department.departmentId = :departmentId) AND " +
           "(:status IS NULL OR j.status = :status) AND " +
           "(:search IS NULL OR LOWER(j.jobTitle) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Job> searchJobs(@Param("search") String search, @Param("departmentId") Long departmentId, @Param("status") String status, Pageable pageable);
}
