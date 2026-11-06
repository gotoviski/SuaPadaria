package com.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MeasurementUnitRequest(

	@NotBlank(message = "Nome é obrigatório")
	String name,

	@NotBlank(message = "Sigla é obrigatória")
	@Size(max = 10, message = "Sigla deve ter no máximo 10 caracteres")
	String abbreviation,

	Boolean active

) {}
