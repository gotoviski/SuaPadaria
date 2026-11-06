package com.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import com.backend.entity.ProductionOrder;
import com.backend.entity.ProductionStatus;

public record ProductionOrderResponse(Long id, Long recipeId, Long productId, String productName,
		BigDecimal plannedQuantity, ProductionStatus status, Instant scheduledDate, Instant startedAt,
		Instant finishedAt, String notes, List<ProductionConsumptionResponse> consumptions,
		List<ProductionResultResponse> results, BigDecimal producedQuantity, Instant createdAt, Instant updatedAt) {

	public static ProductionOrderResponse from(ProductionOrder order) {
		List<ProductionConsumptionResponse> consumptions = order.getConsumptions().stream()
				.map(ProductionConsumptionResponse::from)
				.toList();
		List<ProductionResultResponse> results = order.getResults().stream()
				.map(ProductionResultResponse::from)
				.toList();
		BigDecimal producedQuantity = results.stream().map(ProductionResultResponse::quantity)
				.reduce(BigDecimal.ZERO, BigDecimal::add);
		return new ProductionOrderResponse(order.getId(), order.getRecipe().getId(),
				order.getRecipe().getProduct().getId(), order.getRecipe().getProduct().getName(),
				order.getPlannedQuantity(), order.getStatus(), order.getScheduledDate(), order.getStartedAt(),
				order.getFinishedAt(), order.getNotes(), consumptions, results, producedQuantity,
				order.getCreatedAt(), order.getUpdatedAt());
	}

}
