package com.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import com.backend.entity.ProductionStatus;

public record ProductionOrderRequest(

	@NotNull(message = "Receita é obrigatória")
	Long recipeId,

	@NotNull(message = "Quantidade planejada é obrigatória")
	@DecimalMin(value = "0.001", message = "Quantidade planejada deve ser maior que zero")
	BigDecimal plannedQuantity,

	ProductionStatus status,

	Instant scheduledDate,

	Instant startedAt,

	Instant finishedAt,

	@Size(max = 1000, message = "Observações devem ter no máximo 1000 caracteres")
	String notes,

	List<@Valid ProductionConsumptionRequest> consumptions,

	List<@Valid ProductionResultRequest> results

) {}
