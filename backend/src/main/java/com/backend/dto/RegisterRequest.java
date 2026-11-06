package com.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(

	@NotBlank(message = "Nome é obrigatório")
	String name,

	@NotBlank(message = "E-mail é obrigatório")
	@Email(message = "E-mail inválido")
	String email,

	@NotBlank(message = "Telefone é obrigatório")
	@Pattern(regexp = "^\\+[1-9]\\d{7,14}$", message = "Telefone deve estar no formato internacional (ex: +5511999999999)")
	String phone,

	@NotBlank(message = "Senha é obrigatória")
	@Size(min = 6, message = "Senha deve ter no mínimo 6 caracteres")
	String password

) {}
