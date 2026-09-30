package com.hrgenius.dto.department;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentDto {
    private Long departmentId;

    @NotBlank(message = "Department name is required")
    private String departmentName;

    private String description;
    private String departmentHead;
    private String status;
    private Long employeeCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
