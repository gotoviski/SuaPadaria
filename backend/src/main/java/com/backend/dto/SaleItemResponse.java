package com.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.backend.entity.SaleItem;

public record SaleItemResponse(Long id, Long saleId, Instant saleDate, String customerName, Long productId,
		String productName, BigDecimal quantity, BigDecimal unitPrice, BigDecimal totalPrice) {

	public static SaleItemResponse from(SaleItem item) {
		return new SaleItemResponse(item.getId(), item.getSale().getId(), item.getSale().getSaleDate(),
				item.getSale().getCustomer() != null ? item.getSale().getCustomer().getName() : null,
				item.getProduct().getId(), item.getProduct().getName(), item.getQuantity(), item.getUnitPrice(),
				item.getQuantity().multiply(item.getUnitPrice()));
	}

}
