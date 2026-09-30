package com.hrgenius.dto.leave;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveApprovalDto {
    @NotBlank(message = "Status is required (APPROVED or REJECTED)")
    private String status; // APPROVED, REJECTED
    private String remarks;
}
