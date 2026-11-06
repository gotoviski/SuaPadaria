package com.backend.dto;

import java.time.Instant;

import com.backend.entity.StorageLocation;

public record StorageLocationResponse(Long id, String name, String description, boolean active, Instant createdAt,
		Instant updatedAt) {

	public static StorageLocationResponse from(StorageLocation location) {
		return new StorageLocationResponse(location.getId(), location.getName(), location.getDescription(),
				location.isActive(), location.getCreatedAt(), location.getUpdatedAt());
	}

}
