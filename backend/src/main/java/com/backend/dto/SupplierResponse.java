package com.backend.dto;

import java.time.Instant;

import com.backend.entity.Supplier;

public record SupplierResponse(Long id, String name, String legalName, String cnpj, String contactName, String phone,
		String email, String zipCode, String street, String number, String complement, String district, String city,
		String state, String notes, boolean active, Instant createdAt, Instant updatedAt) {

	public static SupplierResponse from(Supplier supplier) {
		return new SupplierResponse(supplier.getId(), supplier.getName(), supplier.getLegalName(), supplier.getCnpj(),
				supplier.getContactName(), supplier.getPhone(), supplier.getEmail(), supplier.getZipCode(),
				supplier.getStreet(), supplier.getNumber(), supplier.getComplement(), supplier.getDistrict(),
				supplier.getCity(), supplier.getState(), supplier.getNotes(), supplier.isActive(),
				supplier.getCreatedAt(), supplier.getUpdatedAt());
	}

}
