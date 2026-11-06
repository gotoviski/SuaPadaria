package com.backend.dto;

import java.time.Instant;
import java.util.Set;

import com.backend.entity.AccessProfile;
import com.backend.entity.Permission;

public record AccessProfileResponse(Long id, String name, String description, Set<Permission> permissions,
		Instant createdAt, Instant updatedAt) {

	public static AccessProfileResponse from(AccessProfile profile) {
		return new AccessProfileResponse(profile.getId(), profile.getName(), profile.getDescription(),
				profile.getPermissions(), profile.getCreatedAt(), profile.getUpdatedAt());
	}

}
