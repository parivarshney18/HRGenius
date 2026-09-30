package com.hrgenius;

import com.hrgenius.dto.leave.LeaveRequestDto;
import com.hrgenius.entity.Department;
import com.hrgenius.entity.Employee;
import com.hrgenius.entity.LeaveRequest;
import com.hrgenius.exception.BadRequestException;
import com.hrgenius.mapper.EntityMapper;
import com.hrgenius.repository.EmployeeRepository;
import com.hrgenius.repository.LeaveRequestRepository;
import com.hrgenius.service.impl.LeaveServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LeaveServiceTest {

    @Mock
    private LeaveRequestRepository leaveRequestRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Spy
    private EntityMapper mapper;

    @InjectMocks
    private LeaveServiceImpl leaveService;

    private Employee employee;

    @BeforeEach
    void setUp() {
        Department dept = Department.builder().departmentId(1L).departmentName("Engineering").build();
        employee = Employee.builder()
                .employeeId(101L)
                .employeeCode("EMP-1001")
                .firstName("John")
                .lastName("Doe")
                .department(dept)
                .build();
    }

    @Test
    void applyLeave_Successful_CalculatesCorrectDays() {
        LeaveRequestDto request = LeaveRequestDto.builder()
                .employeeId(101L)
                .leaveType("ANNUAL")
                .startDate(LocalDate.of(2026, 10, 1))
                .endDate(LocalDate.of(2026, 10, 5))
                .reason("Vacation")
                .build();

        when(employeeRepository.findById(101L)).thenReturn(Optional.of(employee));
        when(leaveRequestRepository.findOverlappingLeaves(eq(101L), any(), any(), isNull()))
                .thenReturn(Collections.emptyList());
        when(leaveRequestRepository.save(any(LeaveRequest.class))).thenAnswer(i -> {
            LeaveRequest saved = i.getArgument(0);
            saved.setLeaveId(501L);
            return saved;
        });

        LeaveRequestDto response = leaveService.applyLeave(request);

        assertNotNull(response);
        assertEquals(5.0, response.getNumberOfDays()); // Oct 1 to Oct 5 = 5 days
        assertEquals("PENDING", response.getLeaveStatus());
        verify(leaveRequestRepository, times(1)).save(any(LeaveRequest.class));
    }

    @Test
    void applyLeave_OverlappingDates_ThrowsBadRequestException() {
        LeaveRequestDto request = LeaveRequestDto.builder()
                .employeeId(101L)
                .leaveType("CASUAL")
                .startDate(LocalDate.of(2026, 10, 3))
                .endDate(LocalDate.of(2026, 10, 4))
                .reason("Personal")
                .build();

        LeaveRequest existing = LeaveRequest.builder()
                .leaveId(500L)
                .leaveType("ANNUAL")
                .startDate(LocalDate.of(2026, 10, 1))
                .endDate(LocalDate.of(2026, 10, 5))
                .leaveStatus("APPROVED")
                .build();

        when(employeeRepository.findById(101L)).thenReturn(Optional.of(employee));
        when(leaveRequestRepository.findOverlappingLeaves(eq(101L), any(), any(), isNull()))
                .thenReturn(List.of(existing));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> leaveService.applyLeave(request));
        assertTrue(ex.getMessage().contains("overlapping"));
        verify(leaveRequestRepository, never()).save(any(LeaveRequest.class));
    }
}
