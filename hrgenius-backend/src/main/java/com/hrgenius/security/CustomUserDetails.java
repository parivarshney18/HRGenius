package com.hrgenius.security;

import com.hrgenius.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

@Getter
public class CustomUserDetails implements UserDetails {

    private final Long userId;
    private final String username;
    private final String email;
    private final String password;
    private final String roleName;
    private final Long employeeId;
    private final Collection<? extends GrantedAuthority> authorities;
    private final boolean active;

    public CustomUserDetails(User user, Long employeeId) {
        this.userId = user.getUserId();
        this.username = user.getUsername();
        this.email = user.getEmail();
        this.password = user.getPassword();
        this.roleName = user.getRole().getRoleName();
        this.employeeId = employeeId;
        String rawRole = user.getRole().getRoleName();
        java.util.List<GrantedAuthority> authList = new java.util.ArrayList<>();
        if (rawRole != null) {
            if (rawRole.startsWith("ROLE_")) {
                authList.add(new SimpleGrantedAuthority(rawRole));
                authList.add(new SimpleGrantedAuthority(rawRole.substring(5)));
            } else {
                authList.add(new SimpleGrantedAuthority("ROLE_" + rawRole));
                authList.add(new SimpleGrantedAuthority(rawRole));
            }
        }
        this.authorities = Collections.unmodifiableList(authList);
        this.active = "ACTIVE".equalsIgnoreCase(user.getStatus());
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return active;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
