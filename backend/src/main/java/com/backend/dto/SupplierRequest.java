package com.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SupplierRequest(

	@NotBlank(message = "Nome é obrigatório")
	String name,

	String legalName,

	@Pattern(regexp = "^\\d{14}$", message = "CNPJ deve conter 14 dígitos numéricos")
	String cnpj,

	String contactName,

	String phone,

	@Email(message = "E-mail inválido")
	String email,

	@Pattern(regexp = "^\\d{5}-?\\d{3}$", message = "CEP inválido")
	String zipCode,

	String street,

	String number,

	String complement,

	String district,

	String city,

	@Size(max = 2, message = "UF deve ter 2 caracteres")
	String state,

	@Size(max = 1000, message = "Observações devem ter no máximo 1000 caracteres")
	String notes,

	Boolean active

) {}
