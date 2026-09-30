package com.hrgenius.repository;

import com.hrgenius.entity.Department;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    Optional<Department> findByDepartmentNameIgnoreCase(String departmentName);
    boolean existsByDepartmentNameIgnoreCase(String departmentName);
    List<Department> findByStatus(String status);

    @Query("SELECT d FROM Department d WHERE " +
           "(:search IS NULL OR LOWER(d.departmentName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(d.departmentHead) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Department> searchDepartments(@Param("search") String search, Pageable pageable);
}
