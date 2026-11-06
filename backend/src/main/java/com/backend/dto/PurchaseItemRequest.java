package com.backend.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record PurchaseItemRequest(

	@NotNull(message = "Produto é obrigatório")
	Long productId,

	@NotNull(message = "Quantidade é obrigatória")
	@DecimalMin(value = "0.001", message = "Quantidade deve ser maior que zero")
	BigDecimal quantity,

	@NotNull(message = "Preço unitário é obrigatório")
	@DecimalMin(value = "0.00", message = "Preço unitário não pode ser negativo")
	BigDecimal unitPrice

) {}
