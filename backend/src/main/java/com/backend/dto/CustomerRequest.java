package com.backend.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CustomerRequest(

	@NotBlank(message = "Nome é obrigatório")
	String name,

	@NotBlank(message = "Telefone é obrigatório")
	String phone,

	@Email(message = "E-mail inválido")
	String email,

	@Pattern(regexp = "^\\d{11}$", message = "CPF deve conter 11 dígitos numéricos")
	String cpf,

	@Past(message = "Data de nascimento deve ser no passado")
	LocalDate birthDate,

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
