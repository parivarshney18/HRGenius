package com.hrgenius.dto.employee;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeRequest {
    private String employeeCode; // Optional if auto-generated

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    private LocalDate dateOfBirth;

    private String gender; // Male, Female, Other

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    private String phone;
    private String address;

    private LocalDate dateOfJoining;

    private Long departmentId;

    private Long managerId;

    private String designation;

    private String employmentType; // FULL_TIME, PART_TIME, CONTRACT, INTERN
    private String status;         // ACTIVE, ON_LEAVE, TERMINATED, RESIGNED

    // Optional user provisioning info
    private Boolean createAccount;
    private String username;
    private String password;
    private Long roleId;
}
