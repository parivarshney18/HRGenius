package com.hrgenius.repository;

import com.hrgenius.entity.LeaveRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findByEmployeeEmployeeId(Long employeeId);

    List<LeaveRequest> findByLeaveStatus(String leaveStatus);

    @Query("SELECT l FROM LeaveRequest l WHERE " +
           "(:employeeId IS NULL OR l.employee.employeeId = :employeeId) AND " +
           "(:departmentId IS NULL OR l.employee.department.departmentId = :departmentId) AND " +
           "(:managerId IS NULL OR l.employee.manager.employeeId = :managerId) AND " +
           "(:status IS NULL OR l.leaveStatus = :status)")
    Page<LeaveRequest> filterLeaveRequests(
            @Param("employeeId") Long employeeId,
            @Param("departmentId") Long departmentId,
            @Param("managerId") Long managerId,
            @Param("status") String status,
            Pageable pageable
    );

    @Query("SELECT l FROM LeaveRequest l WHERE l.employee.employeeId = :employeeId " +
           "AND l.leaveStatus IN ('PENDING', 'APPROVED') " +
           "AND (:excludeLeaveId IS NULL OR l.leaveId != :excludeLeaveId) " +
           "AND (l.startDate <= :endDate AND l.endDate >= :startDate)")
    List<LeaveRequest> findOverlappingLeaves(
            @Param("employeeId") Long employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("excludeLeaveId") Long excludeLeaveId
    );

    @Query("SELECT l.leaveType, COUNT(l) FROM LeaveRequest l WHERE l.leaveStatus = 'APPROVED' GROUP BY l.leaveType")
    List<Object[]> countLeavesByType();

    @Query("SELECT l.leaveStatus, COUNT(l) FROM LeaveRequest l GROUP BY l.leaveStatus")
    List<Object[]> countLeavesByStatus();
}
