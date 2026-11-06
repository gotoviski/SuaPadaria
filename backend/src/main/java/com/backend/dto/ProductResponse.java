package com.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.backend.entity.Product;

public record ProductResponse(Long id, String name, String description, String category, String unit, BigDecimal price,
		String sku, String notes, boolean active, Instant createdAt, Instant updatedAt) {

	public static ProductResponse from(Product product) {
		return new ProductResponse(product.getId(), product.getName(), product.getDescription(), product.getCategory(),
				product.getUnit(), product.getPrice(), product.getSku(), product.getNotes(), product.isActive(),
				product.getCreatedAt(), product.getUpdatedAt());
	}

}
