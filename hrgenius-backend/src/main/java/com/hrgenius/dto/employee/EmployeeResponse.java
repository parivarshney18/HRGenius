package com.hrgenius.dto.employee;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeResponse {
    private Long employeeId;
    private String employeeCode;
    private Long userId;
    private String username;
    private String firstName;
    private String lastName;
    private String fullName;
    private LocalDate dateOfBirth;
    private String gender;
    private String email;
    private String phone;
    private String address;
    private LocalDate dateOfJoining;
    private Long departmentId;
    private String departmentName;
    private Long managerId;
    private String managerName;
    private String designation;
    private String employmentType;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
