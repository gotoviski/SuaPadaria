package com.backend.dto;

import java.time.Instant;

import com.backend.entity.User;

public record UserResponse(Long id, String name, String email, String phone, Instant createdAt) {

	public static UserResponse from(User user) {
		return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getPhone(), user.getCreatedAt());
	}

}
