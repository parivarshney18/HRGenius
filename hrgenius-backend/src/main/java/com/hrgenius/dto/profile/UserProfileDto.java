package com.hrgenius.dto.profile;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.hrgenius.dto.payroll.PayrollDto;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileDto {

    // Account Details
    @JsonProperty("user_id")
    private Long userId;

    private String username;
    private String role;

    // Personal Details
    @JsonProperty("employee_id")
    private Long employeeId;

    @JsonProperty("employee_code")
    private String employeeCode;

    @JsonProperty("first_name")
    private String firstName;

    @JsonProperty("last_name")
    private String lastName;

    @JsonProperty("full_name")
    private String fullName;

    @JsonProperty("date_of_birth")
    private LocalDate dateOfBirth;

    private String gender;
    private String email;
    private String phone;
    private String address;

    // Employment Details
    @JsonProperty("date_of_joining")
    private LocalDate dateOfJoining;

    @JsonProperty("department_id")
    private Long departmentId;

    @JsonProperty("department_name")
    private String departmentName;

    @JsonProperty("manager_id")
    private Long managerId;

    @JsonProperty("manager_name")
    private String managerName;

    private String designation;

    @JsonProperty("employment_type")
    private String employmentType;

    private String status;

    // Salary / Payroll History
    @JsonProperty("salary_history")
    private List<PayrollDto> salaryHistory;
}
