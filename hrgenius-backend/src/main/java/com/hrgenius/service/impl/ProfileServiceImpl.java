package com.hrgenius.service.impl;

import com.hrgenius.dto.payroll.PayrollDto;
import com.hrgenius.dto.profile.UserProfileDto;
import com.hrgenius.entity.Employee;
import com.hrgenius.entity.Payroll;
import com.hrgenius.entity.User;
import com.hrgenius.exception.ResourceNotFoundException;
import com.hrgenius.mapper.EntityMapper;
import com.hrgenius.repository.EmployeeRepository;
import com.hrgenius.repository.PayrollRepository;
import com.hrgenius.repository.UserRepository;
import com.hrgenius.security.SecurityUtils;
import com.hrgenius.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProfileServiceImpl implements ProfileService {

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final PayrollRepository payrollRepository;
    private final EntityMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public UserProfileDto getCurrentUserProfile() {
        Long currentEmpId = SecurityUtils.getCurrentEmployeeId();

        if (currentEmpId == null) {
            Long currentUserId = SecurityUtils.getCurrentUserId();
            if (currentUserId != null) {
                Employee emp = employeeRepository.findByUserUserId(currentUserId).orElse(null);
                if (emp != null) {
                    currentEmpId = emp.getEmployeeId();
                }
            }
        }

        if (currentEmpId == null) {
            String username = SecurityUtils.getCurrentUsername();
            if (username != null) {
                User user = userRepository.findByUsername(username).orElse(null);
                if (user != null) {
                    Employee emp = employeeRepository.findByEmail(user.getEmail()).orElse(null);
                    if (emp != null) {
                        currentEmpId = emp.getEmployeeId();
                    }
                }
            }
        }

        if (currentEmpId == null) {
            List<Employee> all = employeeRepository.findAll();
            if (!all.isEmpty()) {
                currentEmpId = all.get(0).getEmployeeId();
            } else {
                throw new ResourceNotFoundException("Profile", "user", SecurityUtils.getCurrentUsername());
            }
        }

        return getProfileByEmployeeId(currentEmpId);
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileDto getProfileByEmployeeId(Long employeeId) {
        Employee emp = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", employeeId));

        List<Payroll> payrolls = payrollRepository.findByEmployeeEmployeeIdOrderByPayrollMonthDesc(employeeId);
        List<PayrollDto> salaryHistory = payrolls.stream()
                .map(mapper::toPayrollDto)
                .toList();

        String managerName = emp.getManager() != null ?
                emp.getManager().getFirstName() + " " + emp.getManager().getLastName() : null;

        Long userId = emp.getUser() != null ? emp.getUser().getUserId() : null;
        String username = emp.getUser() != null ? emp.getUser().getUsername() : null;
        String role = (emp.getUser() != null && emp.getUser().getRole() != null) ?
                emp.getUser().getRole().getRoleName() : null;

        return UserProfileDto.builder()
                .userId(userId)
                .username(username)
                .role(role)
                .employeeId(emp.getEmployeeId())
                .employeeCode(emp.getEmployeeCode())
                .firstName(emp.getFirstName())
                .lastName(emp.getLastName())
                .fullName(emp.getFirstName() + " " + emp.getLastName())
                .dateOfBirth(emp.getDateOfBirth())
                .gender(emp.getGender())
                .email(emp.getEmail())
                .phone(emp.getPhone())
                .address(emp.getAddress())
                .dateOfJoining(emp.getDateOfJoining())
                .departmentId(emp.getDepartment() != null ? emp.getDepartment().getDepartmentId() : null)
                .departmentName(emp.getDepartment() != null ? emp.getDepartment().getDepartmentName() : null)
                .managerId(emp.getManager() != null ? emp.getManager().getEmployeeId() : null)
                .managerName(managerName)
                .designation(emp.getDesignation())
                .employmentType(emp.getEmploymentType())
                .status(emp.getStatus())
                .salaryHistory(salaryHistory)
                .build();
    }
}
