package com.hrgenius;

import com.hrgenius.dto.employee.EmployeeResponse;
import com.hrgenius.dto.onboarding.ConvertCandidateRequest;
import com.hrgenius.entity.*;
import com.hrgenius.exception.BadRequestException;
import com.hrgenius.mapper.EntityMapper;
import com.hrgenius.repository.*;
import com.hrgenius.service.EmployeeService;
import com.hrgenius.service.impl.OnboardingServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OnboardingServiceTest {

    @Mock
    private OnboardingRepository onboardingRepository;

    @Mock
    private CandidateRepository candidateRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmployeeService employeeService;

    @Spy
    private EntityMapper mapper;

    @InjectMocks
    private OnboardingServiceImpl onboardingService;

    private Candidate candidate;
    private Onboarding onboarding;
    private Department department;
    private Role empRole;

    @BeforeEach
    void setUp() {
        department = Department.builder().departmentId(1L).departmentName("Engineering").build();
        empRole = Role.builder().roleId(4L).roleName("ROLE_EMPLOYEE").build();

        Job job = Job.builder().jobId(10L).jobTitle("Software Engineer").department(department).build();
        candidate = Candidate.builder()
                .candidateId(50L)
                .candidateName("Michael Chang")
                .candidateEmail("michael.chang@example.com")
                .job(job)
                .applicationStatus("SELECTED")
                .build();

        onboarding = Onboarding.builder()
                .onboardingId(100L)
                .candidate(candidate)
                .joiningDate(LocalDate.of(2026, 10, 15))
                .assignedDepartment(department)
                .onboardingStatus("IN_PROGRESS")
                .build();
    }

    @Test
    void convertCandidateToEmployee_Successful_CreatesEmployeeAndUser() {
        ConvertCandidateRequest request = ConvertCandidateRequest.builder()
                .onboardingId(100L)
                .designation("Software Engineer")
                .dateOfBirth(LocalDate.of(1995, 5, 20))
                .gender("MALE")
                .initialPassword("ChangPass123!")
                .employmentType("FULL_TIME")
                .build();

        when(onboardingRepository.findById(100L)).thenReturn(Optional.of(onboarding));
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(roleRepository.findByRoleName("ROLE_EMPLOYEE")).thenReturn(Optional.of(empRole));
        when(passwordEncoder.encode(anyString())).thenReturn("hashedPass");
        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setUserId(80L);
            return u;
        });
        when(employeeService.generateNextEmployeeCode()).thenReturn("EMP-1006");
        when(employeeRepository.save(any(Employee.class))).thenAnswer(i -> {
            Employee e = i.getArgument(0);
            e.setEmployeeId(300L);
            return e;
        });

        EmployeeResponse response = onboardingService.convertCandidateToEmployee(request);

        assertNotNull(response);
        assertEquals("EMP-1006", response.getEmployeeCode());
        assertEquals("Michael", response.getFirstName());
        assertEquals("Chang", response.getLastName());
        assertEquals("Software Engineer", response.getDesignation());
        assertEquals("COMPLETED", onboarding.getOnboardingStatus());
        assertEquals("VERIFIED", onboarding.getDocumentStatus());

        verify(userRepository, times(1)).save(any(User.class));
        verify(employeeRepository, times(1)).save(any(Employee.class));
        verify(onboardingRepository, times(1)).save(onboarding);
    }

    @Test
    void convertCandidateToEmployee_AlreadyConverted_ThrowsBadRequestException() {
        onboarding.setOnboardingStatus("COMPLETED");

        ConvertCandidateRequest request = ConvertCandidateRequest.builder()
                .onboardingId(100L)
                .designation("Software Engineer")
                .dateOfBirth(LocalDate.of(1995, 5, 20))
                .gender("MALE")
                .build();

        when(onboardingRepository.findById(100L)).thenReturn(Optional.of(onboarding));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                onboardingService.convertCandidateToEmployee(request));

        assertTrue(ex.getMessage().contains("already been converted"));
        verify(userRepository, never()).save(any(User.class));
        verify(employeeRepository, never()).save(any(Employee.class));
    }
}
