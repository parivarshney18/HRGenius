package com.hrgenius.service.impl;

import com.hrgenius.dto.common.PageResponse;
import com.hrgenius.dto.employee.EmployeeRequest;
import com.hrgenius.dto.employee.EmployeeResponse;
import com.hrgenius.entity.Department;
import com.hrgenius.entity.Employee;
import com.hrgenius.entity.Role;
import com.hrgenius.entity.User;
import com.hrgenius.exception.BadRequestException;
import com.hrgenius.exception.DuplicateResourceException;
import com.hrgenius.exception.ResourceNotFoundException;
import com.hrgenius.mapper.EntityMapper;
import com.hrgenius.repository.DepartmentRepository;
import com.hrgenius.repository.EmployeeRepository;
import com.hrgenius.repository.RoleRepository;
import com.hrgenius.repository.UserRepository;
import com.hrgenius.security.SecurityUtils;
import com.hrgenius.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EntityMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<EmployeeResponse> getEmployees(String search, Long departmentId, String status, Long managerId, Pageable pageable) {
        Page<Employee> page = employeeRepository.searchEmployees(search, departmentId, status, managerId, pageable);
        return PageResponse.from(page.map(mapper::toEmployeeResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmployeeResponse> getAllActiveEmployees() {
        return employeeRepository.findByStatus("ACTIVE").stream()
                .map(mapper::toEmployeeResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmployeeResponse> getTeamMembers(Long managerId) {
        return employeeRepository.findByManagerEmployeeId(managerId).stream()
                .map(mapper::toEmployeeResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public EmployeeResponse getEmployeeById(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", employeeId));
        return mapper.toEmployeeResponse(employee);
    }

    @Override
    @Transactional(readOnly = true)
    public EmployeeResponse getEmployeeByUserId(Long userId) {
        Employee employee = employeeRepository.findByUserUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found for user ID: " + userId));
        return mapper.toEmployeeResponse(employee);
    }

    @Override
    @Transactional(readOnly = true)
    public EmployeeResponse getCurrentEmployeeProfile() {
        Long empId = SecurityUtils.getCurrentEmployeeId();
        if (empId != null) {
            return getEmployeeById(empId);
        }
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId != null) {
            return employeeRepository.findByUserUserId(userId)
                    .map(mapper::toEmployeeResponse)
                    .orElseThrow(() -> new ResourceNotFoundException("No employee profile linked to current user"));
        }
        throw new BadRequestException("No authenticated user session");
    }

    @Override
    @Transactional
    public EmployeeResponse createEmployee(EmployeeRequest request) {
        if (employeeRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Employee with email " + request.getEmail() + " already exists");
        }

        String code = (request.getEmployeeCode() != null && !request.getEmployeeCode().isBlank())
                ? request.getEmployeeCode().trim().toUpperCase()
                : generateNextEmployeeCode();

        if (employeeRepository.existsByEmployeeCode(code)) {
            throw new DuplicateResourceException("Employee code " + code + " already in use");
        }

        Department dept = null;
        if (request.getDepartmentId() != null) {
            dept = departmentRepository.findById(request.getDepartmentId())
                    .orElse(null);
        }
        if (dept == null) {
            dept = departmentRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("No department available"));
        }

        Employee manager = null;
        if (request.getManagerId() != null) {
            manager = employeeRepository.findById(request.getManagerId()).orElse(null);
        }

        User user = null;
        if (Boolean.TRUE.equals(request.getCreateAccount())) {
            String username = (request.getUsername() != null && !request.getUsername().isBlank())
                    ? request.getUsername()
                    : (request.getFirstName().toLowerCase() + "." + request.getLastName().toLowerCase());

            if (userRepository.existsByUsername(username)) {
                username = username + "." + (System.currentTimeMillis() % 1000);
            }

            Long roleId = request.getRoleId() != null ? request.getRoleId() : 4L; // Default ROLE_EMPLOYEE
            Role role = roleRepository.findById(roleId)
                    .orElseGet(() -> roleRepository.findByRoleName("ROLE_EMPLOYEE")
                            .orElseThrow(() -> new ResourceNotFoundException("Default role ROLE_EMPLOYEE not found")));

            String rawPassword = (request.getPassword() != null && !request.getPassword().isBlank())
                    ? request.getPassword() : "123456";

            user = User.builder()
                    .username(username)
                    .email(request.getEmail())
                    .password(passwordEncoder.encode(rawPassword))
                    .role(role)
                    .status("ACTIVE")
                    .build();
            user = userRepository.save(user);
        }

        LocalDate dob = request.getDateOfBirth() != null ? request.getDateOfBirth() : LocalDate.of(1995, 1, 1);
        String gender = request.getGender() != null ? request.getGender() : "Other";
        LocalDate doj = request.getDateOfJoining() != null ? request.getDateOfJoining() : LocalDate.now();
        String designation = (request.getDesignation() != null && !request.getDesignation().isBlank())
                ? request.getDesignation().trim() : "Associate Specialist";

        Employee employee = Employee.builder()
                .employeeCode(code)
                .user(user)
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .dateOfBirth(dob)
                .gender(gender)
                .email(request.getEmail().trim())
                .phone(request.getPhone() != null ? request.getPhone() : "+1 (555) 000-0000")
                .address(request.getAddress() != null ? request.getAddress() : "HRGenius Headquarters")
                .dateOfJoining(doj)
                .department(dept)
                .manager(manager)
                .designation(designation)
                .employmentType(request.getEmploymentType() != null ? request.getEmploymentType() : "Full-Time")
                .status(request.getStatus() != null ? request.getStatus() : "Active")
                .build();

        Employee saved = employeeRepository.save(employee);
        return mapper.toEmployeeResponse(saved);
    }

    @Override
    @Transactional
    public EmployeeResponse updateEmployee(Long employeeId, EmployeeRequest request) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", employeeId));

        if (!employee.getEmail().equalsIgnoreCase(request.getEmail()) && employeeRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Employee with email " + request.getEmail() + " already exists");
        }

        if (request.getManagerId() != null && request.getManagerId().equals(employeeId)) {
            throw new BadRequestException("An employee cannot be their own manager");
        }

        Department dept = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.getDepartmentId()));

        Employee manager = null;
        if (request.getManagerId() != null) {
            manager = employeeRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager", "id", request.getManagerId()));
        }

        employee.setFirstName(request.getFirstName().trim());
        employee.setLastName(request.getLastName().trim());
        employee.setDateOfBirth(request.getDateOfBirth());
        employee.setGender(request.getGender());
        employee.setEmail(request.getEmail().trim());
        employee.setPhone(request.getPhone());
        employee.setAddress(request.getAddress());
        employee.setDateOfJoining(request.getDateOfJoining());
        employee.setDepartment(dept);
        employee.setManager(manager);
        employee.setDesignation(request.getDesignation().trim());
        if (request.getEmploymentType() != null) {
            employee.setEmploymentType(request.getEmploymentType());
        }
        if (request.getStatus() != null) {
            employee.setStatus(request.getStatus());
        }

        Employee updated = employeeRepository.save(employee);
        return mapper.toEmployeeResponse(updated);
    }

    @Override
    @Transactional
    public void deleteEmployee(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", employeeId));
        employee.setStatus("TERMINATED");
        employeeRepository.save(employee);
    }

    @Override
    @Transactional(readOnly = true)
    public String generateNextEmployeeCode() {
        long count = employeeRepository.count();
        return String.format("EMP-%04d", count + 1001);
    }
}
