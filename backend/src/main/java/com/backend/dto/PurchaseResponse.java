package com.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import com.backend.entity.Purchase;

public record PurchaseResponse(Long id, Long supplierId, String supplierName, Instant purchaseDate, String notes,
		List<PurchaseItemResponse> items, BigDecimal total, Instant createdAt, Instant updatedAt) {

	public static PurchaseResponse from(Purchase purchase) {
		List<PurchaseItemResponse> items = purchase.getItems().stream().map(PurchaseItemResponse::from).toList();
		BigDecimal total = items.stream().map(PurchaseItemResponse::totalPrice).reduce(BigDecimal.ZERO,
				BigDecimal::add);
		return new PurchaseResponse(purchase.getId(), purchase.getSupplier().getId(),
				purchase.getSupplier().getName(), purchase.getPurchaseDate(), purchase.getNotes(), items, total,
				purchase.getCreatedAt(), purchase.getUpdatedAt());
	}

}
