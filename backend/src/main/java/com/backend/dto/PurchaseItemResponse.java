package com.backend.dto;

import java.math.BigDecimal;

import com.backend.entity.PurchaseItem;

public record PurchaseItemResponse(Long id, Long productId, String productName, BigDecimal quantity,
		BigDecimal unitPrice, BigDecimal totalPrice) {

	public static PurchaseItemResponse from(PurchaseItem item) {
		return new PurchaseItemResponse(item.getId(), item.getProduct().getId(), item.getProduct().getName(),
				item.getQuantity(), item.getUnitPrice(), item.getQuantity().multiply(item.getUnitPrice()));
	}

}
