package com.hrgenius.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "PERFORMANCE_REVIEWS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PerformanceReview extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "performance_id")
    private Long performanceId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "review_period", length = 50, nullable = false)
    private String reviewPeriod; // e.g. 2026-Q1, 2026-Annual

    @Column(name = "goal", columnDefinition = "TEXT", nullable = false)
    private String goal;

    @Column(name = "achievement", columnDefinition = "TEXT")
    private String achievement;

    @Column(name = "rating")
    private Double rating; // 1.0 to 5.0

    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedback;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "manager", "department", "user"})
    private Employee reviewedBy;

    @Column(name = "review_date")
    private LocalDate reviewDate;

    @Column(name = "performance_status", length = 20, nullable = false)
    @Builder.Default
    private String performanceStatus = "DRAFT"; // DRAFT, SUBMITTED, REVIEWED, ACKNOWLEDGED
}
