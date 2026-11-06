package com.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record EmployeeRequest(

	@NotBlank(message = "Nome é obrigatório")
	String name,

	@Pattern(regexp = "^\\d{11}$", message = "CPF deve conter 11 dígitos numéricos")
	String cpf,

	@NotBlank(message = "Telefone é obrigatório")
	String phone,

	@Email(message = "E-mail inválido")
	String email,

	@Past(message = "Data de nascimento deve ser no passado")
	LocalDate birthDate,

	String role,

	String shift,

	@PositiveOrZero(message = "Salário não pode ser negativo")
	BigDecimal salary,

	@PastOrPresent(message = "Data de admissão não pode ser no futuro")
	LocalDate hireDate,

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
