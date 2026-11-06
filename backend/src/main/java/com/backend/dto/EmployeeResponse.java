package com.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import com.backend.entity.Employee;

public record EmployeeResponse(Long id, String name, String cpf, String phone, String email, LocalDate birthDate,
		String role, String shift, BigDecimal salary, LocalDate hireDate, String zipCode, String street, String number,
		String complement, String district, String city, String state, String notes, boolean active, Instant createdAt,
		Instant updatedAt) {

	public static EmployeeResponse from(Employee employee) {
		return new EmployeeResponse(employee.getId(), employee.getName(), employee.getCpf(), employee.getPhone(),
				employee.getEmail(), employee.getBirthDate(), employee.getRole(), employee.getShift(),
				employee.getSalary(), employee.getHireDate(), employee.getZipCode(), employee.getStreet(),
				employee.getNumber(), employee.getComplement(), employee.getDistrict(), employee.getCity(),
				employee.getState(), employee.getNotes(), employee.isActive(), employee.getCreatedAt(),
				employee.getUpdatedAt());
	}

}
