package com.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.backend.entity.StockBalance;

public record StockBalanceResponse(Long id, Long productId, String productName, Long locationId, String locationName,
		BigDecimal quantity, Instant createdAt, Instant updatedAt) {

	public static StockBalanceResponse from(StockBalance balance) {
		return new StockBalanceResponse(balance.getId(), balance.getProduct().getId(), balance.getProduct().getName(),
				balance.getLocation().getId(), balance.getLocation().getName(), balance.getQuantity(),
				balance.getCreatedAt(), balance.getUpdatedAt());
	}

}
