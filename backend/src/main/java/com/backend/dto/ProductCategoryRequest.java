package com.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProductCategoryRequest(

	@NotBlank(message = "Nome é obrigatório")
	String name,

	@Size(max = 1000, message = "Descrição deve ter no máximo 1000 caracteres")
	String description,

	Boolean active

) {}
