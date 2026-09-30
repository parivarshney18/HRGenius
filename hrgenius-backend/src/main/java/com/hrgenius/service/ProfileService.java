package com.hrgenius.service;

import com.hrgenius.dto.profile.UserProfileDto;

public interface ProfileService {
    UserProfileDto getCurrentUserProfile();
    UserProfileDto getProfileByEmployeeId(Long employeeId);
}
