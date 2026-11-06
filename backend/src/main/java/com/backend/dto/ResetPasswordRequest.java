package com.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(

	@NotBlank(message = "E-mail é obrigatório")
	@Email(message = "E-mail inválido")
	String email,

	@NotBlank(message = "Código é obrigatório")
	String code,

	@NotBlank(message = "Nova senha é obrigatória")
	@Size(min = 6, message = "Senha deve ter no mínimo 6 caracteres")
	String newPassword

) {}
