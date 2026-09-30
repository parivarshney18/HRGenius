package com.hrgenius.service.impl;

import com.hrgenius.dto.common.PageResponse;
import com.hrgenius.dto.department.DepartmentDto;
import com.hrgenius.entity.Department;
import com.hrgenius.exception.BadRequestException;
import com.hrgenius.exception.DuplicateResourceException;
import com.hrgenius.exception.ResourceNotFoundException;
import com.hrgenius.mapper.EntityMapper;
import com.hrgenius.repository.DepartmentRepository;
import com.hrgenius.repository.EmployeeRepository;
import com.hrgenius.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;
    private final EntityMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<DepartmentDto> getDepartments(String search, Pageable pageable) {
        Page<Department> page = departmentRepository.searchDepartments(search, pageable);
        return PageResponse.from(page.map(dept -> {
            long count = employeeRepository.findByDepartmentDepartmentId(dept.getDepartmentId()).size();
            return mapper.toDepartmentDto(dept, count);
        }));
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentDto> getAllActiveDepartments() {
        return departmentRepository.findByStatus("ACTIVE").stream()
                .map(dept -> {
                    long count = employeeRepository.findByDepartmentDepartmentId(dept.getDepartmentId()).size();
                    return mapper.toDepartmentDto(dept, count);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DepartmentDto getDepartmentById(Long departmentId) {
        Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", departmentId));
        long count = employeeRepository.findByDepartmentDepartmentId(dept.getDepartmentId()).size();
        return mapper.toDepartmentDto(dept, count);
    }

    @Override
    @Transactional
    public DepartmentDto createDepartment(DepartmentDto dto) {
        if (departmentRepository.existsByDepartmentNameIgnoreCase(dto.getDepartmentName())) {
            throw new DuplicateResourceException("Department with this name already exists");
        }

        Department dept = Department.builder()
                .departmentName(dto.getDepartmentName().trim())
                .description(dto.getDescription())
                .departmentHead(dto.getDepartmentHead())
                .status(dto.getStatus() != null ? dto.getStatus() : "ACTIVE")
                .build();

        Department saved = departmentRepository.save(dept);
        return mapper.toDepartmentDto(saved, 0L);
    }

    @Override
    @Transactional
    public DepartmentDto updateDepartment(Long departmentId, DepartmentDto dto) {
        Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", departmentId));

        if (!dept.getDepartmentName().equalsIgnoreCase(dto.getDepartmentName()) &&
                departmentRepository.existsByDepartmentNameIgnoreCase(dto.getDepartmentName())) {
            throw new DuplicateResourceException("Department with this name already exists");
        }

        dept.setDepartmentName(dto.getDepartmentName().trim());
        dept.setDescription(dto.getDescription());
        dept.setDepartmentHead(dto.getDepartmentHead());
        if (dto.getStatus() != null) {
            dept.setStatus(dto.getStatus());
        }

        Department updated = departmentRepository.save(dept);
        long count = employeeRepository.findByDepartmentDepartmentId(updated.getDepartmentId()).size();
        return mapper.toDepartmentDto(updated, count);
    }

    @Override
    @Transactional
    public void deleteDepartment(Long departmentId) {
        Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", departmentId));

        if (!employeeRepository.findByDepartmentDepartmentId(departmentId).isEmpty()) {
            throw new BadRequestException("Cannot delete department with active or assigned employees");
        }

        departmentRepository.delete(dept);
    }
}
