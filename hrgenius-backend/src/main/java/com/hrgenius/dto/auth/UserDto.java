package com.hrgenius.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {
    private Long userId;

    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    private String password; // only provided on creation or update if changing

    private Long roleId;
    private String roleName;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
    private Long employeeId;
    private String employeeName;
}
