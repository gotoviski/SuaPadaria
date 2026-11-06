package com.backend.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProductRequest(

	@NotBlank(message = "Nome é obrigatório")
	String name,

	@Size(max = 1000, message = "Descrição deve ter no máximo 1000 caracteres")
	String description,

	String category,

	String unit,

	@DecimalMin(value = "0.00", message = "Preço não pode ser negativo")
	BigDecimal price,

	String sku,

	@Size(max = 1000, message = "Observações devem ter no máximo 1000 caracteres")
	String notes,

	Boolean active

) {}
