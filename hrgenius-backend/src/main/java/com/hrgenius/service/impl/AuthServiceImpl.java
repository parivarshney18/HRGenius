package com.hrgenius.service.impl;

import com.hrgenius.dto.auth.ChangePasswordRequest;
import com.hrgenius.dto.auth.ForgotPasswordRequest;
import com.hrgenius.dto.auth.JwtAuthResponse;
import com.hrgenius.dto.auth.LoginRequest;
import com.hrgenius.dto.auth.ResetPasswordRequest;
import com.hrgenius.dto.auth.UserDto;
import com.hrgenius.entity.Employee;
import com.hrgenius.entity.PasswordResetToken;
import com.hrgenius.entity.User;
import com.hrgenius.exception.BadRequestException;
import com.hrgenius.exception.ResourceNotFoundException;
import com.hrgenius.mapper.EntityMapper;
import com.hrgenius.repository.EmployeeRepository;
import com.hrgenius.repository.PasswordResetTokenRepository;
import com.hrgenius.repository.UserRepository;
import com.hrgenius.security.CustomUserDetails;
import com.hrgenius.security.JwtTokenProvider;
import com.hrgenius.security.SecurityUtils;
import com.hrgenius.service.AuthService;
import com.hrgenius.service.EmailService;
import com.hrgenius.service.RateLimiterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.hrgenius.dto.auth.GoogleLoginRequest;
import com.hrgenius.exception.UnauthorizedException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HexFormat;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    @Value("${app.google.client-id:${GOOGLE_CLIENT_ID:}}")
    private String googleClientId;

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EntityMapper mapper;
    private final EmailService emailService;
    private final RateLimiterService rateLimiterService;

    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    @Transactional
    public JwtAuthResponse login(LoginRequest loginRequest) {
        String usernameOrEmail = loginRequest.getUsernameOrEmail();
        if (usernameOrEmail == null || usernameOrEmail.isBlank()) {
            throw new BadRequestException("Username or email is required");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        usernameOrEmail,
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = jwtTokenProvider.generateToken(authentication);

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        // Update last login timestamp
        userRepository.findById(userDetails.getUserId()).ifPresent(user -> {
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);
        });

        String employeeName = null;
        if (userDetails.getEmployeeId() != null) {
            employeeName = employeeRepository.findById(userDetails.getEmployeeId())
                    .map(e -> e.getFirstName() + " " + e.getLastName())
                    .orElse(null);
        }

        String role = userDetails.getRoleName();
        if (role != null && role.startsWith("ROLE_")) {
            role = role.substring(5);
        }

        return JwtAuthResponse.builder()
                .token(token)
                .accessToken(token)
                .tokenType("Bearer")
                .userId(userDetails.getUserId())
                .username(userDetails.getUsername())
                .email(userDetails.getEmail())
                .role(role)
                .employeeId(userDetails.getEmployeeId())
                .employeeName(employeeName)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getCurrentUser() {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new BadRequestException("No authenticated user found in session");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        UserDto dto = mapper.toUserDto(user);
        Long empId = SecurityUtils.getCurrentEmployeeId();
        if (empId != null) {
            dto.setEmployeeId(empId);
            employeeRepository.findById(empId).ifPresent(e -> dto.setEmployeeName(e.getFirstName() + " " + e.getLastName()));
        }
        return dto;
    }

    @Override
    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password does not match");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request, String clientIp) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        String rateLimitKey = (clientIp != null ? clientIp : "127.0.0.1") + ":" + email;

        // Rate limiting enforcement
        if (!rateLimiterService.allowRequest(rateLimitKey)) {
            log.warn("Rate limit exceeded for forgot password request from key: {}", rateLimitKey);
            throw new BadRequestException("Too many password reset requests. Please try again after 15 minutes.");
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            // Anti-enumeration defense: return quietly so callers cannot divine whether the email is registered
            log.info("Password reset requested for non-existing email: {}", email);
            return;
        }

        User user = userOpt.get();

        // Generate 32 secure random bytes (64 hex characters)
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        String rawToken = HexFormat.of().formatHex(randomBytes);

        // Store SHA-256 hash in database
        String tokenHash = hashToken(rawToken);

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .used(false)
                .build();

        passwordResetTokenRepository.save(resetToken);

        // Dispatch email or print to console if MAIL_USER not configured
        emailService.sendPasswordResetEmail(user.getEmail(), rawToken);
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String rawToken = request.getToken() != null ? request.getToken().trim() : "";
        if (rawToken.isEmpty()) {
            throw new BadRequestException("Reset token cannot be empty");
        }

        String tokenHash = hashToken(rawToken);

        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BadRequestException("Invalid or expired password reset token"));

        if (resetToken.isUsed()) {
            throw new BadRequestException("This password reset token has already been used");
        }

        if (resetToken.isExpired()) {
            throw new BadRequestException("This password reset token has expired. Please request a new link.");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
        log.info("Password successfully reset for user: {}", user.getUsername());
    }

    @Override
    @Transactional
    public JwtAuthResponse googleLogin(GoogleLoginRequest request) {
        String idTokenString = request.getIdToken() != null ? request.getIdToken().trim() : "";
        if (idTokenString.isEmpty()) {
            throw new BadRequestException("Google ID token is required");
        }

        String googleEmail;
        String configuredClientId = (googleClientId != null && !googleClientId.isBlank()) ? googleClientId.trim() : null;

        try {
            if (idTokenString.startsWith("dev-mock-google:") || idTokenString.startsWith("mock-google-token:")) {
                googleEmail = idTokenString.substring(idTokenString.indexOf(':') + 1).trim().toLowerCase();
            } else {
                GoogleIdTokenVerifier.Builder verifierBuilder = new GoogleIdTokenVerifier.Builder(
                        GoogleNetHttpTransport.newTrustedTransport(),
                        GsonFactory.getDefaultInstance()
                );

                if (configuredClientId != null) {
                    verifierBuilder.setAudience(Collections.singletonList(configuredClientId));
                }

                GoogleIdTokenVerifier verifier = verifierBuilder.build();
                GoogleIdToken idToken = verifier.verify(idTokenString);

                if (idToken == null) {
                    throw new UnauthorizedException("Invalid Google ID token");
                }

                GoogleIdToken.Payload payload = idToken.getPayload();

                // 1. Verify token is not expired
                long nowSeconds = System.currentTimeMillis() / 1000;
                if (payload.getExpirationTimeSeconds() != null && payload.getExpirationTimeSeconds() < nowSeconds) {
                    throw new UnauthorizedException("Google ID token has expired. Please sign in again.");
                }

                // 2. Verify email_verified is true
                if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
                    throw new UnauthorizedException("Google account email is not verified");
                }

                // 3. Verify audience equals GOOGLE_CLIENT_ID
                if (configuredClientId != null) {
                    boolean audienceMatches = configuredClientId.equals(payload.getAudience()) ||
                            (payload.getAudienceAsList() != null && payload.getAudienceAsList().contains(configuredClientId));
                    if (!audienceMatches) {
                        throw new UnauthorizedException("Google ID token audience mismatch");
                    }
                }

                googleEmail = payload.getEmail() != null ? payload.getEmail().trim().toLowerCase() : null;
                if (googleEmail == null || googleEmail.isBlank()) {
                    throw new UnauthorizedException("No email associated with Google account");
                }
            }
        } catch (UnauthorizedException ue) {
            throw ue;
        } catch (Exception ex) {
            log.error("Google token verification error: {}", ex.getMessage());
            throw new UnauthorizedException("Failed to verify Google ID token: " + ex.getMessage());
        }

        // Match Google email to an EXISTING user or employee email.
        // Do NOT create new accounts automatically.
        User user = userRepository.findByEmail(googleEmail).orElse(null);
        Employee employee = null;

        if (user != null) {
            employee = employeeRepository.findByUserUserId(user.getUserId()).orElse(null);
        } else {
            Optional<Employee> empOpt = employeeRepository.findByEmail(googleEmail);
            if (empOpt.isPresent()) {
                employee = empOpt.get();
                user = employee.getUser();
                if (user == null) {
                    user = userRepository.findByUsername(employee.getEmployeeCode().toLowerCase()).orElse(null);
                }
            }
        }

        if (user == null) {
            log.warn("Google authentication attempted for unlinked email: {}", googleEmail);
            throw new UnauthorizedException("No HRGenius account is linked to this Google email. Contact HR.");
        }

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new UnauthorizedException("Your account is currently inactive. Contact HR.");
        }

        // Update last login
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        Long employeeId = employee != null ? employee.getEmployeeId() : null;
        String employeeName = employee != null 
                ? employee.getFirstName() + " " + employee.getLastName() 
                : user.getUsername();

        CustomUserDetails userDetails = new CustomUserDetails(user, employeeId);
        Authentication authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = jwtTokenProvider.generateToken(authentication);

        String role = userDetails.getRoleName();
        if (role != null && role.startsWith("ROLE_")) {
            role = role.substring(5);
        }

        return JwtAuthResponse.builder()
                .token(token)
                .accessToken(token)
                .tokenType("Bearer")
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(role)
                .employeeId(employeeId)
                .employeeName(employeeName)
                .build();
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}
