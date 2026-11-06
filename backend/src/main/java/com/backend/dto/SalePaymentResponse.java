package com.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.backend.entity.PaymentMethod;
import com.backend.entity.SalePayment;

public record SalePaymentResponse(Long id, Long saleId, Instant saleDate, PaymentMethod method,
		BigDecimal amount) {

	public static SalePaymentResponse from(SalePayment payment) {
		return new SalePaymentResponse(payment.getId(), payment.getSale().getId(), payment.getSale().getSaleDate(),
				payment.getMethod(), payment.getAmount());
	}

}
