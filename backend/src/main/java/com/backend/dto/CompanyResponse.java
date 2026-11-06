package com.backend.dto;

import java.time.Instant;

import com.backend.entity.Company;

public record CompanyResponse(Long id, String tradeName, String legalName, String cnpj, String email, String phone,
		String zipCode, String street, String number, String complement, String district, String city, String state,
		String openingHours, String logoUrl, Instant createdAt, Instant updatedAt) {

	public static CompanyResponse from(Company company) {
		return new CompanyResponse(company.getId(), company.getTradeName(), company.getLegalName(), company.getCnpj(),
				company.getEmail(), company.getPhone(), company.getZipCode(), company.getStreet(), company.getNumber(),
				company.getComplement(), company.getDistrict(), company.getCity(), company.getState(),
				company.getOpeningHours(), company.getLogoUrl(), company.getCreatedAt(), company.getUpdatedAt());
	}

}
