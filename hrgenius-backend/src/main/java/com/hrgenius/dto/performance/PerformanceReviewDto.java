package com.hrgenius.dto.performance;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PerformanceReviewDto {
    private Long performanceId;

    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private String departmentName;

    private String reviewPeriod;

    @NotBlank(message = "Goal is required")
    private String goal;

    private String achievement;

    @DecimalMin(value = "0.0", message = "Rating must be at least 0.0")
    @DecimalMax(value = "5.0", message = "Rating must not exceed 5.0")
    private Double rating;

    private String feedback;

    private Long reviewedById;
    private String reviewedByName;
    private LocalDate reviewDate;

    private String performanceStatus; // DRAFT, SUBMITTED, REVIEWED, ACKNOWLEDGED, Completed, In Progress
    private LocalDateTime createdAt;

    @JsonProperty("reviewed_by")
    public Long getReviewedBy() {
        return reviewedById;
    }

    @JsonProperty("reviewed_by")
    public void setReviewedBy(Long reviewedBy) {
        this.reviewedById = reviewedBy;
    }

    @JsonProperty("reviewed_by_id")
    public Long getReviewedById() {
        return reviewedById;
    }

    @JsonProperty("reviewed_by_id")
    public void setReviewedById(Long reviewedById) {
        this.reviewedById = reviewedById;
    }
}
