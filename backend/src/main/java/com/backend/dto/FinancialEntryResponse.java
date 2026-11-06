package com.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.backend.entity.CashMovementType;
import com.backend.entity.FinancialEntry;

public record FinancialEntryResponse(Long id, Long financialAccountId, String financialAccountName,
		CashMovementType type, BigDecimal amount, String description, Long accountPayableId,
		Long accountReceivableId, Instant entryDate, Instant createdAt, Instant updatedAt) {

	public static FinancialEntryResponse from(FinancialEntry entry) {
		return new FinancialEntryResponse(entry.getId(), entry.getFinancialAccount().getId(),
				entry.getFinancialAccount().getName(), entry.getType(), entry.getAmount(),
				entry.getDescription(),
				entry.getAccountPayable() != null ? entry.getAccountPayable().getId() : null,
				entry.getAccountReceivable() != null ? entry.getAccountReceivable().getId() : null,
				entry.getEntryDate(), entry.getCreatedAt(), entry.getUpdatedAt());
	}

}
