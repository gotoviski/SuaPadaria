package com.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.backend.entity.InventoryItem;

public record InventoryItemResponse(Long id, Long inventoryId, Instant inventoryDate, String locationName,
		Long productId, String productName, BigDecimal expectedQuantity, BigDecimal countedQuantity,
		BigDecimal difference) {

	public static InventoryItemResponse from(InventoryItem item) {
		return new InventoryItemResponse(item.getId(), item.getInventory().getId(),
				item.getInventory().getInventoryDate(), item.getInventory().getLocation().getName(),
				item.getProduct().getId(), item.getProduct().getName(), item.getExpectedQuantity(),
				item.getCountedQuantity(), item.getCountedQuantity().subtract(item.getExpectedQuantity()));
	}

}
