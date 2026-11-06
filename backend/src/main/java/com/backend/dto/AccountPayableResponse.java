package com.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import com.backend.entity.AccountPayable;
import com.backend.entity.PayableCategory;
import com.backend.entity.PayableStatus;
import com.backend.entity.PaymentMethod;

public record AccountPayableResponse(Long id, Long supplierId, String supplierName, String description,
		PayableCategory category, BigDecimal amount, LocalDate dueDate, LocalDate paidDate, PayableStatus status,
		PaymentMethod paymentMethod, Long financialAccountId, String financialAccountName, String notes,
		boolean overdue, Instant createdAt, Instant updatedAt) {

	public static AccountPayableResponse from(AccountPayable payable) {
		return new AccountPayableResponse(payable.getId(),
				payable.getSupplier() != null ? payable.getSupplier().getId() : null,
				payable.getSupplier() != null ? payable.getSupplier().getName() : null,
				payable.getDescription(), payable.getCategory(), payable.getAmount(), payable.getDueDate(),
				payable.getPaidDate(), payable.getStatus(), payable.getPaymentMethod(),
				payable.getFinancialAccount() != null ? payable.getFinancialAccount().getId() : null,
				payable.getFinancialAccount() != null ? payable.getFinancialAccount().getName() : null,
				payable.getNotes(),
				payable.getStatus() == PayableStatus.PENDING
						&& payable.getDueDate().isBefore(LocalDate.now()),
				payable.getCreatedAt(), payable.getUpdatedAt());
	}

}
