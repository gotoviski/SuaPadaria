package com.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CompanyRequest(

	@NotBlank(message = "Nome fantasia é obrigatório")
	String tradeName,

	String legalName,

	@Pattern(regexp = "^\\d{14}$", message = "CNPJ deve conter 14 dígitos numéricos")
	String cnpj,

	@Email(message = "E-mail inválido")
	String email,

	String phone,

	@Pattern(regexp = "^\\d{5}-?\\d{3}$", message = "CEP inválido")
	String zipCode,

	String street,

	String number,

	String complement,

	String district,

	String city,

	@Size(max = 2, message = "UF deve ter 2 caracteres")
	String state,

	String openingHours,

	String logoUrl

) {}
