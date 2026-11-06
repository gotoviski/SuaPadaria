package com.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import com.backend.entity.MovementType;

public record StockMovementRequest(

	@NotNull(message = "Produto é obrigatório")
	Long productId,

	@NotNull(message = "Local de estoque é obrigatório")
	Long locationId,

	Long batchId,

	@NotNull(message = "Tipo de movimentação é obrigatório")
	MovementType type,

	@NotNull(message = "Quantidade é obrigatória")
	@DecimalMin(value = "0.001", message = "Quantidade deve ser maior que zero")
	BigDecimal quantity,

	String reason,

	String reference,

	Instant movementDate,

	@Size(max = 1000, message = "Observações devem ter no máximo 1000 caracteres")
	String notes

) {}
