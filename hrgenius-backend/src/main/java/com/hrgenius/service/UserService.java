package com.hrgenius.service;

import com.hrgenius.dto.auth.UserDto;
import com.hrgenius.dto.common.PageResponse;
import org.springframework.data.domain.Pageable;

public interface UserService {
    PageResponse<UserDto> getUsers(String search, Pageable pageable);
    UserDto getUserById(Long userId);
    UserDto createUser(UserDto userDto);
    UserDto updateUser(Long userId, UserDto userDto);
    void deleteUser(Long userId);
    void setUserStatus(Long userId, String status);
}
