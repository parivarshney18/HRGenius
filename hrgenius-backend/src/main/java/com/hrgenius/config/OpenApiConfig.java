package com.hrgenius.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "HRGenius Enterprise HRMS REST API",
                version = "1.0.0",
                description = "Complete API documentation for HRGenius Human Resource Management System with JWT Authentication and Role-Based Access Control (ADMIN, HR, MANAGER, EMPLOYEE)",
                contact = @Contact(
                        name = "HRGenius Engineering",
                        email = "dev@hrgenius.com"
                ),
                license = @License(
                        name = "Apache 2.0"
                )
        ),
        security = {
                @SecurityRequirement(name = "BearerAuth")
        }
)
@SecurityScheme(
        name = "BearerAuth",
        description = "JWT Bearer Token Authentication",
        type = SecuritySchemeType.HTTP,
        bearerFormat = "JWT",
        scheme = "bearer"
)
public class OpenApiConfig {
}
