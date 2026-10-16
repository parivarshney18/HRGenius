package com.hrgenius;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class HrGeniusApplication {

    public static void main(String[] args) {
        // Some managed MySQL providers expose their connection string as
        // mysql://..., while Connector/J requires the jdbc:mysql:// scheme.
        // Normalize that form before Spring Boot binds DB_URL.
        String dbUrl = System.getenv("DB_URL");
        if (dbUrl != null && dbUrl.startsWith("mysql://")) {
            System.setProperty("DB_URL", "jdbc:" + dbUrl);
        }

        SpringApplication.run(HrGeniusApplication.class, args);
    }
}
