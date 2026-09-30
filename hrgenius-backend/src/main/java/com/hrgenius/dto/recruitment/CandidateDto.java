package com.hrgenius.dto.recruitment;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
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
public class CandidateDto {
    private Long candidateId;

    @NotNull(message = "Job ID is required")
    private Long jobId;
    private String jobTitle;

    @NotBlank(message = "Candidate name is required")
    private String candidateName;

    @NotBlank(message = "Candidate email is required")
    @Email(message = "Invalid email format")
    private String candidateEmail;

    private String phone;

    @JsonAlias({"resume", "resume_url"})
    @JsonProperty("resume")
    private String resume;

    @JsonProperty("resume_url")
    private String resumeUrl;

    public String getResume() {
        return resume != null ? resume : resumeUrl;
    }

    public String getResumeUrl() {
        return resumeUrl != null ? resumeUrl : resume;
    }

    private LocalDate applicationDate;
    private String applicationStatus; // Applied, Shortlisted, Interviewed, Selected, Rejected
    private LocalDateTime interviewDate;

    @JsonProperty("interview_date")
    public String getInterviewDateFormatted() {
        if (interviewDate == null) return null;
        if (interviewDate.getHour() == 0 && interviewDate.getMinute() == 0) {
            return interviewDate.toLocalDate().toString();
        }
        return interviewDate.toString();
    }

    @JsonProperty("interview_date")
    public void setInterviewDateFromAny(Object val) {
        if (val == null) {
            this.interviewDate = null;
        } else if (val instanceof String s && !s.isBlank()) {
            try {
                if (s.length() == 10) {
                    this.interviewDate = LocalDate.parse(s).atStartOfDay();
                } else {
                    this.interviewDate = LocalDateTime.parse(s.replace(" ", "T"));
                }
            } catch (Exception e) {
                this.interviewDate = null;
            }
        }
    }

    private String interviewResult;
    private Long onboardingId;
    private LocalDateTime createdAt;
}
