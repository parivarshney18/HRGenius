package com.hrgenius.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "JOBS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Job extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_jobs_gen")
    @SequenceGenerator(name = "seq_jobs_gen", sequenceName = "SEQ_JOBS", allocationSize = 1)
    @Column(name = "job_id")
    private Long jobId;

    @Column(name = "job_title", length = 150, nullable = false)
    private String jobTitle;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Lob
    @Column(name = "description")
    private String description;

    @Lob
    @Column(name = "requirements")
    private String requirements;

    @Column(name = "openings", nullable = false)
    @Builder.Default
    private Integer openings = 1;

    @Column(name = "posting_date", nullable = false)
    @Builder.Default
    private LocalDate postingDate = LocalDate.now();

    @Column(name = "closing_date")
    private LocalDate closingDate;

    @Column(name = "status", length = 20, nullable = false)
    @Builder.Default
    private String status = "OPEN"; // OPEN, CLOSED, ON_HOLD
}
