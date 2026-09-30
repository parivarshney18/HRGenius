package com.hrgenius.service.impl;

import com.hrgenius.dto.auth.ChangePasswordRequest;
import com.hrgenius.dto.auth.JwtAuthResponse;
import com.hrgenius.dto.auth.LoginRequest;
import com.hrgenius.dto.auth.UserDto;
import com.hrgenius.entity.Employee;
import com.hrgenius.entity.User;
import com.hrgenius.exception.BadRequestException;
import com.hrgenius.exception.ResourceNotFoundException;
import com.hrgenius.mapper.EntityMapper;
import com.hrgenius.repository.EmployeeRepository;
import com.hrgenius.repository.UserRepository;
import com.hrgenius.security.CustomUserDetails;
import com.hrgenius.security.JwtTokenProvider;
import com.hrgenius.security.SecurityUtils;
import com.hrgenius.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final EntityMapper mapper;

    @Override
    @Transactional
    public JwtAuthResponse login(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsernameOrEmail(),
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
}
