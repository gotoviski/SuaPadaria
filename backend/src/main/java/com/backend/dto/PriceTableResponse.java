package com.backend.dto;

import java.time.Instant;
import java.util.List;

import com.backend.entity.PriceTable;

public record PriceTableResponse(Long id, String name, String description, boolean active,
		List<PriceTableItemResponse> items, Instant createdAt, Instant updatedAt) {

	public static PriceTableResponse from(PriceTable table) {
		return new PriceTableResponse(table.getId(), table.getName(), table.getDescription(), table.isActive(),
				table.getItems().stream().map(PriceTableItemResponse::from).toList(), table.getCreatedAt(),
				table.getUpdatedAt());
	}

}
