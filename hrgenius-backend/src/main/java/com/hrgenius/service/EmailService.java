package com.hrgenius.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUser;

    @Value("${app.frontend-url:http://localhost:4200}")
    private String frontendUrl;

    public void sendPasswordResetEmail(String toEmail, String token) {
        String resetLink = frontendUrl + "/reset-password?token=" + token;

        // Requirement 7: If MAIL_USER is not set, do not crash: print the reset link in the backend console instead.
        if (mailUser == null || mailUser.trim().isEmpty() || mailSender == null) {
            printConsoleResetLink(toEmail, resetLink);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailUser);
            message.setTo(toEmail);
            message.setSubject("HRGenius - Password Reset Request");
            message.setText("Hello,\n\n"
                    + "A password reset request was submitted for your HRGenius account.\n\n"
                    + "Please click the link below to set a new password:\n"
                    + resetLink + "\n\n"
                    + "This link will expire in 30 minutes.\n\n"
                    + "If you did not request a password reset, you can safely ignore this email.\n\n"
                    + "Best regards,\nHRGenius Security Team");

            mailSender.send(message);
            log.info("Password reset email sent to {}", toEmail);
        } catch (Exception ex) {
            log.warn("Failed to send password reset email via SMTP to {}: {}. Printing link to console as fallback.",
                    toEmail, ex.getMessage());
            printConsoleResetLink(toEmail, resetLink);
        }
    }

    private void printConsoleResetLink(String toEmail, String resetLink) {
        String banner = "\n"
                + "================================================================================\n"
                + "               [HRGenius - PASSWORD RESET LINK GENERATED]                      \n"
                + "================================================================================\n"
                + " Recipient Email : " + toEmail + "\n"
                + " Reset Link      : " + resetLink + "\n"
                + " Validity        : 30 minutes\n"
                + " Notice          : Open this URL in your browser to set a new password.\n"
                + "================================================================================\n";
        System.out.println(banner);
        log.info("Generated password reset link for {}: {}", toEmail, resetLink);
    }
}
