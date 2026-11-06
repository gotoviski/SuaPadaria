package com.backend.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record InventoryItemRequest(

	Long inventoryId,

	@NotNull(message = "Produto é obrigatório")
	Long productId,

	@NotNull(message = "Quantidade esperada é obrigatória")
	@DecimalMin(value = "0.00", message = "Quantidade esperada não pode ser negativa")
	BigDecimal expectedQuantity,

	@NotNull(message = "Quantidade contada é obrigatória")
	@DecimalMin(value = "0.00", message = "Quantidade contada não pode ser negativa")
	BigDecimal countedQuantity

) {}
