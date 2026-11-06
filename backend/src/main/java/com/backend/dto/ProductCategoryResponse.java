package com.backend.dto;

import java.time.Instant;

import com.backend.entity.ProductCategory;

public record ProductCategoryResponse(Long id, String name, String description, boolean active, Instant createdAt,
		Instant updatedAt) {

	public static ProductCategoryResponse from(ProductCategory category) {
		return new ProductCategoryResponse(category.getId(), category.getName(), category.getDescription(),
				category.isActive(), category.getCreatedAt(), category.getUpdatedAt());
	}

}
