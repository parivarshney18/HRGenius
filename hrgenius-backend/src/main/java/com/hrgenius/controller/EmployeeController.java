package com.hrgenius.controller;

import com.hrgenius.dto.common.ApiResponse;
import com.hrgenius.dto.common.PageResponse;
import com.hrgenius.dto.employee.EmployeeRequest;
import com.hrgenius.dto.employee.EmployeeResponse;
import com.hrgenius.service.EmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
@Tag(name = "Employees", description = "Endpoints for employee directory, profiling, and lifecycle management")
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping
    @Operation(summary = "Search employees with pagination and filters (returns List when unpaged, PageResponse when page parameter is provided)")
    public ResponseEntity<?> getEmployees(
            @RequestParam(required = false) String search,
            @RequestParam(required = false, name = "department_id") Long departmentIdSnake,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long managerId,
            @RequestParam(required = false) Integer page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "firstName") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {

        Long deptId = departmentIdSnake != null ? departmentIdSnake : departmentId;

        if (page != null) {
            Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
            Pageable pageable = PageRequest.of(page, size, sort);
            return ResponseEntity.ok(employeeService.getEmployees(search, deptId, status, managerId, pageable));
        }

        Pageable unpaged = PageRequest.of(0, 1000, Sort.by("firstName").ascending());
        List<EmployeeResponse> list = employeeService.getEmployees(search, deptId, status, managerId, unpaged).getContent();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/department/{deptId}")
    @Operation(summary = "Get employees by department ID")
    public ResponseEntity<List<EmployeeResponse>> getEmployeesByDepartment(@PathVariable Long deptId) {
        Pageable unpaged = PageRequest.of(0, 1000, Sort.by("firstName").ascending());
        List<EmployeeResponse> list = employeeService.getEmployees(null, deptId, null, null, unpaged).getContent();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/active")
    @Operation(summary = "Get all active employees (for manager and approver dropdowns)")
    public ResponseEntity<List<EmployeeResponse>> getActiveEmployees() {
        return ResponseEntity.ok(employeeService.getAllActiveEmployees());
    }

    @GetMapping("/team/{managerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER')")
    @Operation(summary = "Get team members reporting to a specific manager")
    public ResponseEntity<List<EmployeeResponse>> getTeamMembers(@PathVariable Long managerId) {
        return ResponseEntity.ok(employeeService.getTeamMembers(managerId));
    }

    @GetMapping("/profile/me")
    @Operation(summary = "Get current logged-in employee profile (Self-Service)")
    public ResponseEntity<EmployeeResponse> getCurrentProfile() {
        return ResponseEntity.ok(employeeService.getCurrentEmployeeProfile());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get employee by ID")
    public ResponseEntity<EmployeeResponse> getEmployeeById(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.getEmployeeById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Create a new employee (Admin / HR)")
    public ResponseEntity<EmployeeResponse> createEmployee(@Valid @RequestBody EmployeeRequest request) {
        EmployeeResponse response = employeeService.createEmployee(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Update employee details (Admin / HR)")
    public ResponseEntity<EmployeeResponse> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeRequest request) {
        EmployeeResponse response = employeeService.updateEmployee(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Terminate employee (Admin / HR)")
    public ResponseEntity<Void> deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.noContent().build();
    }
}
