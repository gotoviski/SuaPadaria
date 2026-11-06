package com.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.backend.entity.FinancialAccount;
import com.backend.entity.FinancialAccountType;

public record FinancialAccountResponse(Long id, String name, FinancialAccountType type, String bankName,
		String agency, String accountNumber, BigDecimal initialBalance, BigDecimal balance, String notes,
		boolean active, Instant createdAt, Instant updatedAt) {

	public static FinancialAccountResponse from(FinancialAccount account, BigDecimal balance) {
		return new FinancialAccountResponse(account.getId(), account.getName(), account.getType(),
				account.getBankName(), account.getAgency(), account.getAccountNumber(),
				account.getInitialBalance(), balance, account.getNotes(), account.isActive(),
				account.getCreatedAt(), account.getUpdatedAt());
	}

}
