package com.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import com.backend.entity.AccountReceivable;
import com.backend.entity.PaymentMethod;
import com.backend.entity.ReceivableStatus;

public record AccountReceivableResponse(Long id, Long customerId, String customerName, String description,
		BigDecimal amount, LocalDate dueDate, LocalDate receivedDate, ReceivableStatus status,
		PaymentMethod paymentMethod, Long financialAccountId, String financialAccountName, String notes,
		boolean overdue, Instant createdAt, Instant updatedAt) {

	public static AccountReceivableResponse from(AccountReceivable receivable) {
		return new AccountReceivableResponse(receivable.getId(),
				receivable.getCustomer() != null ? receivable.getCustomer().getId() : null,
				receivable.getCustomer() != null ? receivable.getCustomer().getName() : null,
				receivable.getDescription(), receivable.getAmount(), receivable.getDueDate(),
				receivable.getReceivedDate(), receivable.getStatus(), receivable.getPaymentMethod(),
				receivable.getFinancialAccount() != null ? receivable.getFinancialAccount().getId() : null,
				receivable.getFinancialAccount() != null ? receivable.getFinancialAccount().getName() : null,
				receivable.getNotes(),
				receivable.getStatus() == ReceivableStatus.PENDING
						&& receivable.getDueDate().isBefore(LocalDate.now()),
				receivable.getCreatedAt(), receivable.getUpdatedAt());
	}

}
