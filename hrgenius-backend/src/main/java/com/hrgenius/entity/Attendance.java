package com.hrgenius.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "ATTENDANCE", uniqueConstraints = {
    @UniqueConstraint(name = "UK_ATTENDANCE_EMP_DATE", columnNames = {"employee_id", "attendance_date"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attendance extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "attendance_id")
    private Long attendanceId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;

    @Column(name = "check_in")
    private LocalDateTime checkIn;

    @Column(name = "check_out")
    private LocalDateTime checkOut;

    @Column(name = "attendance_status", length = 20, nullable = false)
    @Builder.Default
    private String attendanceStatus = "PRESENT"; // PRESENT, ABSENT, HALF_DAY, LATE, ON_LEAVE

    @Column(name = "working_hours")
    @Builder.Default
    private Double workingHours = 0.0;

    @Column(name = "remarks", length = 255)
    private String remarks;
}
