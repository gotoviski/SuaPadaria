package com.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import com.backend.entity.Sale;

public record SaleResponse(Long id, Long customerId, String customerName, Long employeeId, String employeeName,
		Long cashRegisterId, Instant saleDate, String notes, List<SaleItemResponse> items,
		List<SalePaymentResponse> payments, BigDecimal total, BigDecimal paidTotal, Instant createdAt,
		Instant updatedAt) {

	public static SaleResponse from(Sale sale) {
		List<SaleItemResponse> items = sale.getItems().stream().map(SaleItemResponse::from).toList();
		List<SalePaymentResponse> payments = sale.getPayments().stream().map(SalePaymentResponse::from).toList();
		BigDecimal total = items.stream().map(SaleItemResponse::totalPrice).reduce(BigDecimal.ZERO, BigDecimal::add);
		BigDecimal paidTotal = payments.stream().map(SalePaymentResponse::amount).reduce(BigDecimal.ZERO,
				BigDecimal::add);
		return new SaleResponse(sale.getId(), sale.getCustomer() != null ? sale.getCustomer().getId() : null,
				sale.getCustomer() != null ? sale.getCustomer().getName() : null,
				sale.getEmployee() != null ? sale.getEmployee().getId() : null,
				sale.getEmployee() != null ? sale.getEmployee().getName() : null,
				sale.getCashRegister() != null ? sale.getCashRegister().getId() : null, sale.getSaleDate(),
				sale.getNotes(), items, payments, total, paidTotal, sale.getCreatedAt(), sale.getUpdatedAt());
	}

}
