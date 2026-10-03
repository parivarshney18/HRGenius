package com.hrgenius.service;

import com.hrgenius.dto.auth.ChangePasswordRequest;
import com.hrgenius.dto.auth.ForgotPasswordRequest;
import com.hrgenius.dto.auth.JwtAuthResponse;
import com.hrgenius.dto.auth.LoginRequest;
import com.hrgenius.dto.auth.ResetPasswordRequest;
import com.hrgenius.dto.auth.UserDto;

public interface AuthService {
    JwtAuthResponse login(LoginRequest loginRequest);
    UserDto getCurrentUser();
    void changePassword(ChangePasswordRequest request);
    void forgotPassword(ForgotPasswordRequest request, String clientIp);
    void resetPassword(ResetPasswordRequest request);
    JwtAuthResponse googleLogin(com.hrgenius.dto.auth.GoogleLoginRequest request);
}
