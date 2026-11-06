package com.backend.dto;

import java.time.Instant;

import com.backend.entity.MeasurementUnit;

public record MeasurementUnitResponse(Long id, String name, String abbreviation, boolean active, Instant createdAt,
		Instant updatedAt) {

	public static MeasurementUnitResponse from(MeasurementUnit unit) {
		return new MeasurementUnitResponse(unit.getId(), unit.getName(), unit.getAbbreviation(), unit.isActive(),
				unit.getCreatedAt(), unit.getUpdatedAt());
	}

}
