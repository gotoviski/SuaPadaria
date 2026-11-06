package com.backend.dto;

import java.time.Instant;
import java.time.LocalDate;

import com.backend.entity.Customer;

public record CustomerResponse(Long id, String name, String phone, String email, String cpf, LocalDate birthDate,
		String zipCode, String street, String number, String complement, String district, String city, String state,
		String notes, boolean active, Instant createdAt, Instant updatedAt) {

	public static CustomerResponse from(Customer customer) {
		return new CustomerResponse(customer.getId(), customer.getName(), customer.getPhone(), customer.getEmail(),
				customer.getCpf(), customer.getBirthDate(), customer.getZipCode(), customer.getStreet(),
				customer.getNumber(), customer.getComplement(), customer.getDistrict(), customer.getCity(),
				customer.getState(), customer.getNotes(), customer.isActive(), customer.getCreatedAt(),
				customer.getUpdatedAt());
	}

}
