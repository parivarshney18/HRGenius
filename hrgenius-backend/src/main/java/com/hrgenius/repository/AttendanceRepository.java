package com.hrgenius.repository;

import com.hrgenius.entity.Attendance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Optional<Attendance> findByEmployeeEmployeeIdAndAttendanceDate(Long employeeId, LocalDate attendanceDate);

    @Query("SELECT a FROM Attendance a WHERE " +
           "(:employeeId IS NULL OR a.employee.employeeId = :employeeId) AND " +
           "(:departmentId IS NULL OR a.employee.department.departmentId = :departmentId) AND " +
           "(:startDate IS NULL OR a.attendanceDate >= :startDate) AND " +
           "(:endDate IS NULL OR a.attendanceDate <= :endDate) AND " +
           "(:status IS NULL OR a.attendanceStatus = :status)")
    Page<Attendance> filterAttendance(
            @Param("employeeId") Long employeeId,
            @Param("departmentId") Long departmentId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("status") String status,
            Pageable pageable
    );

    @Query("SELECT a.attendanceStatus, COUNT(a) FROM Attendance a WHERE a.attendanceDate = :date GROUP BY a.attendanceStatus")
    List<Object[]> countAttendanceByStatusForDate(@Param("date") LocalDate date);

    @Query("SELECT AVG(a.workingHours) FROM Attendance a WHERE a.attendanceDate = :date AND a.attendanceStatus = 'PRESENT'")
    Double averageWorkingHoursForDate(@Param("date") LocalDate date);
}
