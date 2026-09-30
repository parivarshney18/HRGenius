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
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_perf_gen")
    @SequenceGenerator(name = "seq_perf_gen", sequenceName = "SEQ_PERFORMANCE_REVIEWS", allocationSize = 1)
    @Column(name = "performance_id")
    private Long performanceId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "review_period", length = 50, nullable = false)
    private String reviewPeriod; // e.g. 2026-Q1, 2026-Annual

    @Lob
    @Column(name = "goal", nullable = false)
    private String goal;

    @Lob
    @Column(name = "achievement")
    private String achievement;

    @Column(name = "rating")
    private Double rating; // 1.0 to 5.0

    @Lob
    @Column(name = "feedback")
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
