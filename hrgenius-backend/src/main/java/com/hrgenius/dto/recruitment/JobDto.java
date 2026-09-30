package com.hrgenius.dto.recruitment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobDto {
    private Long jobId;

    @NotBlank(message = "Job title is required")
    private String jobTitle;

    @NotNull(message = "Department ID is required")
    private Long departmentId;
    private String departmentName;

    private String description;
    private String requirements;
    private Integer openings;
    private LocalDate postingDate;
    private LocalDate closingDate;
    private String status; // OPEN, CLOSED, ON_HOLD
    private Long applicantCount;
    private LocalDateTime createdAt;
}
