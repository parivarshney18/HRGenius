package com.hrgenius.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "ONBOARDING")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Onboarding extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "onboarding_id")
    private Long onboardingId;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "candidate_id", nullable = false, unique = true)
    private Candidate candidate;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", unique = true)
    private Employee employee;

    @Column(name = "joining_date", nullable = false)
    private LocalDate joiningDate;

    @Column(name = "document_status", length = 30, nullable = false)
    @Builder.Default
    private String documentStatus = "PENDING"; // PENDING, SUBMITTED, VERIFIED, REJECTED

    @Column(name = "verification_status", length = 30, nullable = false)
    @Builder.Default
    private String verificationStatus = "PENDING"; // PENDING, IN_PROGRESS, PASSED, FAILED

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assigned_department", nullable = false)
    private Department assignedDepartment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_manager")
    private Employee assignedManager;

    @Column(name = "onboarding_status", length = 30, nullable = false)
    @Builder.Default
    private String onboardingStatus = "IN_PROGRESS"; // IN_PROGRESS, COMPLETED, CANCELLED
}
