package com.backend.dto;

import java.time.Instant;
import java.util.List;

import com.backend.entity.Inventory;
import com.backend.entity.InventoryStatus;

public record InventoryResponse(Long id, Long locationId, String locationName, Instant inventoryDate,
		InventoryStatus status, String notes, List<InventoryItemResponse> items, Instant createdAt,
		Instant updatedAt) {

	public static InventoryResponse from(Inventory inventory) {
		List<InventoryItemResponse> items = inventory.getItems().stream().map(InventoryItemResponse::from).toList();
		return new InventoryResponse(inventory.getId(), inventory.getLocation().getId(),
				inventory.getLocation().getName(), inventory.getInventoryDate(), inventory.getStatus(),
				inventory.getNotes(), items, inventory.getCreatedAt(), inventory.getUpdatedAt());
	}

}
