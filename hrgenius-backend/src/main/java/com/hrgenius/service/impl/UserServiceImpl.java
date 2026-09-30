package com.hrgenius.service.impl;

import com.hrgenius.dto.auth.UserDto;
import com.hrgenius.dto.common.PageResponse;
import com.hrgenius.entity.Role;
import com.hrgenius.entity.User;
import com.hrgenius.exception.BadRequestException;
import com.hrgenius.exception.DuplicateResourceException;
import com.hrgenius.exception.ResourceNotFoundException;
import com.hrgenius.mapper.EntityMapper;
import com.hrgenius.repository.RoleRepository;
import com.hrgenius.repository.UserRepository;
import com.hrgenius.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EntityMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserDto> getUsers(String search, Pageable pageable) {
        Page<User> page = userRepository.searchUsers(search, pageable);
        return PageResponse.from(page.map(mapper::toUserDto));
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return mapper.toUserDto(user);
    }

    @Override
    @Transactional
    public UserDto createUser(UserDto userDto) {
        if (userRepository.existsByUsername(userDto.getUsername())) {
            throw new DuplicateResourceException("Username is already taken");
        }
        if (userRepository.existsByEmail(userDto.getEmail())) {
            throw new DuplicateResourceException("Email is already in use");
        }

        Role role = roleRepository.findById(userDto.getRoleId())
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", userDto.getRoleId()));

        String rawPassword = (userDto.getPassword() != null && !userDto.getPassword().isBlank())
                ? userDto.getPassword() : "Default@123";

        User user = User.builder()
                .username(userDto.getUsername())
                .email(userDto.getEmail())
                .password(passwordEncoder.encode(rawPassword))
                .role(role)
                .status(userDto.getStatus() != null ? userDto.getStatus() : "ACTIVE")
                .build();

        User saved = userRepository.save(user);
        return mapper.toUserDto(saved);
    }

    @Override
    @Transactional
    public UserDto updateUser(Long userId, UserDto userDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!user.getUsername().equals(userDto.getUsername()) && userRepository.existsByUsername(userDto.getUsername())) {
            throw new DuplicateResourceException("Username is already taken");
        }
        if (!user.getEmail().equals(userDto.getEmail()) && userRepository.existsByEmail(userDto.getEmail())) {
            throw new DuplicateResourceException("Email is already in use");
        }

        user.setUsername(userDto.getUsername());
        user.setEmail(userDto.getEmail());

        if (userDto.getRoleId() != null) {
            Role role = roleRepository.findById(userDto.getRoleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Role", "id", userDto.getRoleId()));
            user.setRole(role);
        }

        if (userDto.getStatus() != null) {
            user.setStatus(userDto.getStatus());
        }

        if (userDto.getPassword() != null && !userDto.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(userDto.getPassword()));
        }

        User updated = userRepository.save(user);
        return mapper.toUserDto(updated);
    }

    @Override
    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        if ("admin".equalsIgnoreCase(user.getUsername())) {
            throw new BadRequestException("Default system administrator cannot be deleted");
        }
        userRepository.delete(user);
    }

    @Override
    @Transactional
    public void setUserStatus(Long userId, String status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        user.setStatus(status);
        userRepository.save(user);
    }
}
