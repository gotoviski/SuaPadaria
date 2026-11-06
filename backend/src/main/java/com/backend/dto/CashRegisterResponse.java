package com.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.backend.entity.CashRegister;
import com.backend.entity.CashRegisterStatus;

public record CashRegisterResponse(Long id, Long employeeId, String employeeName, Instant openedAt, Instant closedAt,
		BigDecimal openingAmount, BigDecimal closingAmount, CashRegisterStatus status, String notes,
		Instant createdAt, Instant updatedAt) {

	public static CashRegisterResponse from(CashRegister cashRegister) {
		return new CashRegisterResponse(cashRegister.getId(),
				cashRegister.getEmployee() != null ? cashRegister.getEmployee().getId() : null,
				cashRegister.getEmployee() != null ? cashRegister.getEmployee().getName() : null,
				cashRegister.getOpenedAt(), cashRegister.getClosedAt(), cashRegister.getOpeningAmount(),
				cashRegister.getClosingAmount(), cashRegister.getStatus(), cashRegister.getNotes(),
				cashRegister.getCreatedAt(), cashRegister.getUpdatedAt());
	}

}
