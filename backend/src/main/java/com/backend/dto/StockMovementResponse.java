package com.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.backend.entity.MovementType;
import com.backend.entity.StockMovement;

public record StockMovementResponse(Long id, Long productId, String productName, Long locationId, String locationName,
		Long batchId, String batchNumber, MovementType type, BigDecimal quantity, String reason, String reference,
		Instant movementDate, String notes, Instant createdAt, Instant updatedAt) {

	public static StockMovementResponse from(StockMovement movement) {
		return new StockMovementResponse(movement.getId(), movement.getProduct().getId(),
				movement.getProduct().getName(), movement.getLocation().getId(), movement.getLocation().getName(),
				movement.getBatch() == null ? null : movement.getBatch().getId(),
				movement.getBatch() == null ? null : movement.getBatch().getBatchNumber(), movement.getType(),
				movement.getQuantity(), movement.getReason(), movement.getReference(), movement.getMovementDate(),
				movement.getNotes(), movement.getCreatedAt(), movement.getUpdatedAt());
	}

}
