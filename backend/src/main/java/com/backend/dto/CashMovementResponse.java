package com.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.backend.entity.CashMovement;
import com.backend.entity.CashMovementType;

public record CashMovementResponse(Long id, Long cashRegisterId, CashMovementType type, BigDecimal amount,
		String description, Instant movementDate, Instant createdAt, Instant updatedAt) {

	public static CashMovementResponse from(CashMovement movement) {
		return new CashMovementResponse(movement.getId(), movement.getCashRegister().getId(), movement.getType(),
				movement.getAmount(), movement.getDescription(), movement.getMovementDate(),
				movement.getCreatedAt(), movement.getUpdatedAt());
	}

}
