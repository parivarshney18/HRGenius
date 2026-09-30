package com.hrgenius.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "CANDIDATES")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Candidate extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_candidates_gen")
    @SequenceGenerator(name = "seq_candidates_gen", sequenceName = "SEQ_CANDIDATES", allocationSize = 1)
    @Column(name = "candidate_id")
    private Long candidateId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @Column(name = "candidate_name", length = 150, nullable = false)
    private String candidateName;

    @Column(name = "candidate_email", length = 150, nullable = false)
    private String candidateEmail;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "resume_url", length = 500)
    private String resumeUrl;

    @Column(name = "application_date", nullable = false)
    @Builder.Default
    private LocalDate applicationDate = LocalDate.now();

    @Column(name = "application_status", length = 30, nullable = false)
    @Builder.Default
    private String applicationStatus = "APPLIED"; // APPLIED, SCREENED, INTERVIEW_SCHEDULED, SELECTED, REJECTED

    @Column(name = "interview_date")
    private LocalDateTime interviewDate;

    @Column(name = "interview_result", length = 500)
    private String interviewResult;
}
