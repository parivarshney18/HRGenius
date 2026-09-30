package com.hrgenius.service;

import com.hrgenius.dto.common.PageResponse;
import com.hrgenius.dto.department.DepartmentDto;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface DepartmentService {
    PageResponse<DepartmentDto> getDepartments(String search, Pageable pageable);
    List<DepartmentDto> getAllActiveDepartments();
    DepartmentDto getDepartmentById(Long departmentId);
    DepartmentDto createDepartment(DepartmentDto dto);
    DepartmentDto updateDepartment(Long departmentId, DepartmentDto dto);
    void deleteDepartment(Long departmentId);
}
