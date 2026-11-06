package com.backend.dto;

import java.math.BigDecimal;

import com.backend.entity.ProductionResult;

public record ProductionResultResponse(Long id, Long orderId, Long productId, String productName,
		BigDecimal quantity) {

	public static ProductionResultResponse from(ProductionResult result) {
		return new ProductionResultResponse(result.getId(), result.getProductionOrder().getId(),
				result.getProduct().getId(), result.getProduct().getName(), result.getQuantity());
	}

}
