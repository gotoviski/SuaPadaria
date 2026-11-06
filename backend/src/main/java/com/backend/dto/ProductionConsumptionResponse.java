package com.backend.dto;

import java.math.BigDecimal;

import com.backend.entity.ProductionConsumption;

public record ProductionConsumptionResponse(Long id, Long orderId, String orderProductName, Long productId,
		String productName, BigDecimal quantity) {

	public static ProductionConsumptionResponse from(ProductionConsumption consumption) {
		return new ProductionConsumptionResponse(consumption.getId(), consumption.getProductionOrder().getId(),
				consumption.getProductionOrder().getRecipe().getProduct().getName(), consumption.getProduct().getId(),
				consumption.getProduct().getName(), consumption.getQuantity());
	}

}
