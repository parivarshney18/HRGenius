package com.hrgenius.dto.onboarding;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConvertCandidateRequest {
    @NotNull(message = "Onboarding ID is required")
    private Long onboardingId;

    @NotBlank(message = "Designation is required")
    private String designation;

    @NotNull(message = "Date of birth is required")
    private LocalDate dateOfBirth;

    @NotBlank(message = "Gender is required")
    private String gender; // MALE, FEMALE, OTHER

    private String address;
    private String phone;
    private String employmentType; // FULL_TIME, etc.
    private String initialPassword; // Defaults to "employee123" if null/blank
}
