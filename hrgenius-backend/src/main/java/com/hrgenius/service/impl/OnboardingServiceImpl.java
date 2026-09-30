package com.hrgenius.service.impl;

import com.hrgenius.dto.common.PageResponse;
import com.hrgenius.dto.employee.EmployeeResponse;
import com.hrgenius.dto.onboarding.ConvertCandidateRequest;
import com.hrgenius.dto.onboarding.OnboardingDto;
import com.hrgenius.entity.*;
import com.hrgenius.exception.BadRequestException;
import com.hrgenius.exception.ResourceNotFoundException;
import com.hrgenius.mapper.EntityMapper;
import com.hrgenius.repository.*;
import com.hrgenius.service.EmployeeService;
import com.hrgenius.service.OnboardingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class OnboardingServiceImpl implements OnboardingService {

    private final OnboardingRepository onboardingRepository;
    private final CandidateRepository candidateRepository;
    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmployeeService employeeService;
    private final EntityMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OnboardingDto> getOnboardingList(String search, String status, Pageable pageable) {
        Page<Onboarding> page = onboardingRepository.searchOnboarding(search, status, pageable);
        return PageResponse.from(page.map(mapper::toOnboardingDto));
    }

    @Override
    @Transactional(readOnly = true)
    public OnboardingDto getOnboardingById(Long onboardingId) {
        Onboarding onb = onboardingRepository.findById(onboardingId)
                .orElseThrow(() -> new ResourceNotFoundException("Onboarding", "id", onboardingId));
        return mapper.toOnboardingDto(onb);
    }

    @Override
    @Transactional(readOnly = true)
    public OnboardingDto getOnboardingByCandidateId(Long candidateId) {
        Onboarding onb = onboardingRepository.findByCandidateCandidateId(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Onboarding not found for candidate ID: " + candidateId));
        return mapper.toOnboardingDto(onb);
    }

    @Override
    @Transactional
    public OnboardingDto updateOnboarding(Long onboardingId, OnboardingDto dto) {
        Onboarding onb = onboardingRepository.findById(onboardingId)
                .orElseThrow(() -> new ResourceNotFoundException("Onboarding", "id", onboardingId));

        if (dto.getJoiningDate() != null) onb.setJoiningDate(dto.getJoiningDate());
        if (dto.getDocumentStatus() != null) onb.setDocumentStatus(dto.getDocumentStatus());
        if (dto.getVerificationStatus() != null) onb.setVerificationStatus(dto.getVerificationStatus());
        if (dto.getOnboardingStatus() != null) onb.setOnboardingStatus(dto.getOnboardingStatus());

        if (dto.getAssignedDepartmentId() != null) {
            Department dept = departmentRepository.findById(dto.getAssignedDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", "id", dto.getAssignedDepartmentId()));
            onb.setAssignedDepartment(dept);
        }

        if (dto.getAssignedManagerId() != null) {
            Employee manager = employeeRepository.findById(dto.getAssignedManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager", "id", dto.getAssignedManagerId()));
            onb.setAssignedManager(manager);
        }

        Onboarding updated = onboardingRepository.save(onb);
        return mapper.toOnboardingDto(updated);
    }

    @Override
    @Transactional
    public EmployeeResponse convertCandidateToEmployee(ConvertCandidateRequest request) {
        Onboarding onb = onboardingRepository.findById(request.getOnboardingId())
                .orElseThrow(() -> new ResourceNotFoundException("Onboarding", "id", request.getOnboardingId()));

        if (onb.getEmployee() != null || "COMPLETED".equalsIgnoreCase(onb.getOnboardingStatus())) {
            throw new BadRequestException("This candidate has already been converted to an employee");
        }

        Candidate candidate = onb.getCandidate();
        if (candidate == null) {
            throw new BadRequestException("No candidate linked to this onboarding record");
        }

        // Split candidate name into First and Last
        String[] nameParts = candidate.getCandidateName().trim().split("\\s+", 2);
        String firstName = nameParts[0];
        String lastName = nameParts.length > 1 ? nameParts[1] : "";

        // 1. Automatically provision User account
        String baseUsername = (firstName + "." + (lastName.isBlank() ? "emp" : lastName)).toLowerCase().replaceAll("[^a-z0-9.]", "");
        String username = baseUsername;
        int counter = 1;
        while (userRepository.existsByUsername(username)) {
            username = baseUsername + counter;
            counter++;
        }

        Role employeeRole = roleRepository.findByRoleName("ROLE_EMPLOYEE")
                .orElseGet(() -> roleRepository.save(Role.builder().roleName("ROLE_EMPLOYEE").description("Standard Employee").build()));

        String rawPassword = (request.getInitialPassword() != null && !request.getInitialPassword().isBlank())
                ? request.getInitialPassword() : "employee123";

        User user = User.builder()
                .username(username)
                .email(candidate.getCandidateEmail())
                .password(passwordEncoder.encode(rawPassword))
                .role(employeeRole)
                .status("ACTIVE")
                .build();
        User savedUser = userRepository.save(user);

        // 2. Automatically create Employee record
        String employeeCode = employeeService.generateNextEmployeeCode();

        Employee employee = Employee.builder()
                .employeeCode(employeeCode)
                .user(savedUser)
                .firstName(firstName)
                .lastName(lastName)
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .email(candidate.getCandidateEmail())
                .phone(request.getPhone() != null ? request.getPhone() : candidate.getPhone())
                .address(request.getAddress())
                .dateOfJoining(onb.getJoiningDate())
                .department(onb.getAssignedDepartment())
                .manager(onb.getAssignedManager())
                .designation(request.getDesignation())
                .employmentType(request.getEmploymentType() != null ? request.getEmploymentType() : "FULL_TIME")
                .status("ACTIVE")
                .build();
        Employee savedEmployee = employeeRepository.save(employee);

        // 3. Update candidate and onboarding records
        candidate.setApplicationStatus("SELECTED");
        candidateRepository.save(candidate);

        onb.setEmployee(savedEmployee);
        onb.setDocumentStatus("VERIFIED");
        onb.setVerificationStatus("PASSED");
        onb.setOnboardingStatus("COMPLETED");
        onboardingRepository.save(onb);

        return mapper.toEmployeeResponse(savedEmployee);
    }

    @Override
    @Transactional
    public java.util.Map<String, Object> completeOnboarding(Long onboardingId, java.util.Map<String, Object> payload) {
        Onboarding onb = onboardingRepository.findById(onboardingId)
                .orElseThrow(() -> new ResourceNotFoundException("Onboarding", "id", onboardingId));

        if (payload != null) {
            if (payload.get("joining_date") != null) {
                try {
                    onb.setJoiningDate(LocalDate.parse(payload.get("joining_date").toString()));
                } catch (Exception ignored) {}
            }
            if (payload.get("document_status") != null) {
                onb.setDocumentStatus(payload.get("document_status").toString());
            }
            if (payload.get("verification_status") != null) {
                onb.setVerificationStatus(payload.get("verification_status").toString());
            }
            Object deptVal = payload.get("assigned_department");
            if (deptVal instanceof Number num) {
                departmentRepository.findById(num.longValue()).ifPresent(onb::setAssignedDepartment);
            } else if (deptVal instanceof String str && !str.isBlank()) {
                try {
                    departmentRepository.findById(Long.parseLong(str)).ifPresent(onb::setAssignedDepartment);
                } catch (NumberFormatException ignored) {}
            }
            Object mgrVal = payload.get("assigned_manager");
            if (mgrVal instanceof Number num) {
                employeeRepository.findById(num.longValue()).ifPresent(onb::setAssignedManager);
            } else if (mgrVal instanceof String str && !str.isBlank()) {
                try {
                    employeeRepository.findById(Long.parseLong(str)).ifPresent(onb::setAssignedManager);
                } catch (NumberFormatException ignored) {}
            }
        }

        Candidate candidate = onb.getCandidate();
        if (candidate == null) {
            throw new BadRequestException("No candidate linked to this onboarding record");
        }

        Employee savedEmployee = onb.getEmployee();
        if (savedEmployee == null) {
            String[] nameParts = candidate.getCandidateName().trim().split("\\s+", 2);
            String firstName = nameParts[0];
            String lastName = nameParts.length > 1 ? nameParts[1] : "";

            String baseUsername = (firstName + "." + (lastName.isBlank() ? "emp" : lastName)).toLowerCase().replaceAll("[^a-z0-9.]", "");
            String username = baseUsername;
            int counter = 1;
            while (userRepository.existsByUsername(username)) {
                username = baseUsername + counter;
                counter++;
            }

            Role employeeRole = roleRepository.findByRoleName("ROLE_EMPLOYEE")
                    .orElseGet(() -> roleRepository.save(Role.builder().roleName("ROLE_EMPLOYEE").description("Standard Employee").build()));

            User user = User.builder()
                    .username(username)
                    .email(candidate.getCandidateEmail())
                    .password(passwordEncoder.encode("123456"))
                    .role(employeeRole)
                    .status("ACTIVE")
                    .build();
            User savedUser = userRepository.save(user);

            String employeeCode = employeeService.generateNextEmployeeCode();
            String designation = payload != null && payload.get("designation") != null
                    ? payload.get("designation").toString() : "Associate Specialist";
            String phone = payload != null && payload.get("phone") != null
                    ? payload.get("phone").toString() : (candidate.getPhone() != null ? candidate.getPhone() : "+1 (555) 987-6543");
            String address = payload != null && payload.get("address") != null
                    ? payload.get("address").toString() : "777 Enterprise Way, Suite 400, New York, NY";

            Employee employee = Employee.builder()
                    .employeeCode(employeeCode)
                    .user(savedUser)
                    .firstName(firstName)
                    .lastName(lastName)
                    .dateOfBirth(LocalDate.of(1995, 5, 15))
                    .gender("Other")
                    .email(candidate.getCandidateEmail())
                    .phone(phone)
                    .address(address)
                    .dateOfJoining(onb.getJoiningDate() != null ? onb.getJoiningDate() : LocalDate.now())
                    .department(onb.getAssignedDepartment() != null ? onb.getAssignedDepartment() : departmentRepository.findAll().stream().findFirst().orElse(null))
                    .manager(onb.getAssignedManager())
                    .designation(designation)
                    .employmentType("Full-Time")
                    .status("Active")
                    .build();
            savedEmployee = employeeRepository.save(employee);
        }

        candidate.setApplicationStatus("Selected");
        candidateRepository.save(candidate);

        onb.setEmployee(savedEmployee);
        onb.setDocumentStatus("Verified");
        onb.setVerificationStatus("Passed");
        onb.setOnboardingStatus("Completed");
        Onboarding savedOnb = onboardingRepository.save(onb);

        EmployeeResponse empResp = mapper.toEmployeeResponse(savedEmployee);
        OnboardingDto onbDto = mapper.toOnboardingDto(savedOnb);

        java.util.Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("employee", empResp);
        result.put("onboarding", onbDto);
        result.put("onboarding_id", onbDto.getOnboardingId());
        result.put("candidate_id", onbDto.getCandidateId());
        result.put("employee_id", empResp.getEmployeeId());
        result.put("joining_date", onbDto.getJoiningDate());
        result.put("document_status", onbDto.getDocumentStatus());
        result.put("verification_status", onbDto.getVerificationStatus());
        result.put("assigned_department", onbDto.getAssignedDepartment());
        result.put("assigned_manager", onbDto.getAssignedManager());
        result.put("onboarding_status", onbDto.getOnboardingStatus());
        return result;
    }
}
