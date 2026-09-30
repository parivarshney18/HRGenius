package com.hrgenius.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {}

    public static CustomUserDetails getCurrentUserDetails() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails) {
            return (CustomUserDetails) auth.getPrincipal();
        }
        return null;
    }

    public static Long getCurrentUserId() {
        CustomUserDetails user = getCurrentUserDetails();
        return user != null ? user.getUserId() : null;
    }

    public static Long getCurrentEmployeeId() {
        CustomUserDetails user = getCurrentUserDetails();
        return user != null ? user.getEmployeeId() : null;
    }

    public static String getCurrentUsername() {
        CustomUserDetails user = getCurrentUserDetails();
        return user != null ? user.getUsername() : null;
    }

    public static String getCurrentRole() {
        CustomUserDetails user = getCurrentUserDetails();
        return user != null ? user.getRoleName() : null;
    }

    public static boolean hasAnyRole(String... roles) {
        String currentRole = getCurrentRole();
        if (currentRole == null) return false;
        String cleanCurrent = currentRole.replace("ROLE_", "");
        for (String r : roles) {
            String cleanR = r.replace("ROLE_", "");
            if (cleanCurrent.equalsIgnoreCase(cleanR)) {
                return true;
            }
        }
        return false;
    }
}
