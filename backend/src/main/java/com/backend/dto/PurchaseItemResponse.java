package com.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.backend.entity.PurchaseItem;

public record PurchaseItemResponse(Long id, Long purchaseId, Instant purchaseDate, String supplierName,
		Long productId, String productName, BigDecimal quantity, BigDecimal unitPrice, BigDecimal totalPrice) {

	public static PurchaseItemResponse from(PurchaseItem item) {
		return new PurchaseItemResponse(item.getId(), item.getPurchase().getId(), item.getPurchase().getPurchaseDate(),
				item.getPurchase().getSupplier().getName(), item.getProduct().getId(), item.getProduct().getName(),
				item.getQuantity(), item.getUnitPrice(), item.getQuantity().multiply(item.getUnitPrice()));
	}

}
