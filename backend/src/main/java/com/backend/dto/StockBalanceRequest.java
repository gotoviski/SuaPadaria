package com.backend.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record StockBalanceRequest(

	@NotNull(message = "Produto é obrigatório")
	Long productId,

	@NotNull(message = "Local de estoque é obrigatório")
	Long locationId,

	@NotNull(message = "Quantidade é obrigatória")
	@DecimalMin(value = "0.00", message = "Quantidade não pode ser negativa")
	BigDecimal quantity

) {}
