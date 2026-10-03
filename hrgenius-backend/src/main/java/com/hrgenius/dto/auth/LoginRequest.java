package com.hrgenius.dto.auth;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequest {

    @JsonAlias({"username", "email", "username_or_email", "email_or_username", "emailOrUsername"})
    private String username;

    private String email;

    private String usernameOrEmail;

    @NotBlank(message = "Password is required")
    private String password;

    public String getUsernameOrEmail() {
        if (username != null && !username.isBlank()) {
            return username.trim();
        }
        if (email != null && !email.isBlank()) {
            return email.trim();
        }
        if (usernameOrEmail != null && !usernameOrEmail.isBlank()) {
            return usernameOrEmail.trim();
        }
        return null;
    }
}
