package com.backend.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record PriceTableItemRequest(

	@NotNull(message = "Produto é obrigatório")
	Long productId,

	@NotNull(message = "Preço é obrigatório")
	@DecimalMin(value = "0.00", message = "Preço não pode ser negativo")
	BigDecimal price

) {}
