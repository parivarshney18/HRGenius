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

    @JsonAlias({"username", "email", "username_or_email"})
    private String username;

    private String usernameOrEmail;

    @NotBlank(message = "Password is required")
    private String password;

    public String getUsernameOrEmail() {
        if (username != null && !username.isBlank()) {
            return username;
        }
        return usernameOrEmail;
    }
}
