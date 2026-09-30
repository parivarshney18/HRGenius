package com.hrgenius.dto.onboarding;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OnboardingDto {
    private Long onboardingId;

    @NotNull(message = "Candidate ID is required")
    private Long candidateId;
    private String candidateName;
    private String candidateEmail;
    private String candidatePhone;

    private Long employeeId;
    private String employeeCode;

    @NotNull(message = "Joining date is required")
    private LocalDate joiningDate;

    private String documentStatus;     // PENDING, SUBMITTED, VERIFIED, REJECTED
    private String verificationStatus; // PENDING, IN_PROGRESS, PASSED, FAILED

    private Long assignedDepartmentId;
    private String assignedDepartmentName;

    @JsonProperty("assigned_department")
    public Object getAssignedDepartment() {
        return assignedDepartmentId != null ? assignedDepartmentId : assignedDepartmentName;
    }

    @JsonProperty("assigned_department")
    public void setAssignedDepartment(Object dept) {
        if (dept instanceof Number n) {
            this.assignedDepartmentId = n.longValue();
        } else if (dept instanceof String s && !s.isBlank()) {
            try {
                this.assignedDepartmentId = Long.parseLong(s);
            } catch (NumberFormatException ignored) {
                this.assignedDepartmentName = s;
            }
        }
    }

    private Long assignedManagerId;
    private String assignedManagerName;

    @JsonProperty("assigned_manager")
    public Object getAssignedManager() {
        return assignedManagerId != null ? assignedManagerId : assignedManagerName;
    }

    @JsonProperty("assigned_manager")
    public void setAssignedManager(Object mgr) {
        if (mgr instanceof Number n) {
            this.assignedManagerId = n.longValue();
        } else if (mgr instanceof String s && !s.isBlank()) {
            try {
                this.assignedManagerId = Long.parseLong(s);
            } catch (NumberFormatException ignored) {
                this.assignedManagerName = s;
            }
        }
    }

    private String onboardingStatus;   // IN_PROGRESS, COMPLETED, CANCELLED
    private LocalDateTime createdAt;
}
