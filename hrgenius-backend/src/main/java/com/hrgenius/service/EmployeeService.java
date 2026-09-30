package com.hrgenius.service;

import com.hrgenius.dto.common.PageResponse;
import com.hrgenius.dto.employee.EmployeeRequest;
import com.hrgenius.dto.employee.EmployeeResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface EmployeeService {
    PageResponse<EmployeeResponse> getEmployees(String search, Long departmentId, String status, Long managerId, Pageable pageable);
    List<EmployeeResponse> getAllActiveEmployees();
    List<EmployeeResponse> getTeamMembers(Long managerId);
    EmployeeResponse getEmployeeById(Long employeeId);
    EmployeeResponse getEmployeeByUserId(Long userId);
    EmployeeResponse getCurrentEmployeeProfile();
    EmployeeResponse createEmployee(EmployeeRequest request);
    EmployeeResponse updateEmployee(Long employeeId, EmployeeRequest request);
    void deleteEmployee(Long employeeId);
    String generateNextEmployeeCode();
}
