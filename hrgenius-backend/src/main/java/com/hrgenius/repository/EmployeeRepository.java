package com.hrgenius.repository;

import com.hrgenius.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Optional<Employee> findByEmployeeCode(String employeeCode);
    Optional<Employee> findByEmail(String email);
    Optional<Employee> findByUserUserId(Long userId);
    boolean existsByEmployeeCode(String employeeCode);
    boolean existsByEmail(String email);

    List<Employee> findByDepartmentDepartmentId(Long departmentId);
    List<Employee> findByManagerEmployeeId(Long managerId);
    List<Employee> findByStatus(String status);

    @Query("SELECT e FROM Employee e WHERE " +
           "(:departmentId IS NULL OR e.department.departmentId = :departmentId) AND " +
           "(:status IS NULL OR e.status = :status) AND " +
           "(:managerId IS NULL OR e.manager.employeeId = :managerId) AND " +
           "(:search IS NULL OR LOWER(e.firstName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(e.lastName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(e.employeeCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(e.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(e.designation) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Employee> searchEmployees(
            @Param("search") String search,
            @Param("departmentId") Long departmentId,
            @Param("status") String status,
            @Param("managerId") Long managerId,
            Pageable pageable
    );

    @Query("SELECT e.department.departmentName, COUNT(e) FROM Employee e WHERE e.status = 'ACTIVE' GROUP BY e.department.departmentName")
    List<Object[]> countEmployeesByDepartment();

    @Query("SELECT e.gender, COUNT(e) FROM Employee e WHERE e.status = 'ACTIVE' GROUP BY e.gender")
    List<Object[]> countEmployeesByGender();
}
