package com.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import com.backend.entity.StockBatch;

public record StockBatchResponse(Long id, Long productId, String productName, Long locationId, String locationName,
		String batchNumber, BigDecimal quantity, LocalDate manufactureDate, LocalDate expirationDate, String notes,
		Instant createdAt, Instant updatedAt) {

	public static StockBatchResponse from(StockBatch batch) {
		return new StockBatchResponse(batch.getId(), batch.getProduct().getId(), batch.getProduct().getName(),
				batch.getLocation().getId(), batch.getLocation().getName(), batch.getBatchNumber(),
				batch.getQuantity(), batch.getManufactureDate(), batch.getExpirationDate(), batch.getNotes(),
				batch.getCreatedAt(), batch.getUpdatedAt());
	}

}
