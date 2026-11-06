package com.backend.dto;

import java.util.Set;

import jakarta.validation.constraints.NotBlank;

import com.backend.entity.Permission;

public record AccessProfileRequest(

	@NotBlank(message = "Nome é obrigatório")
	String name,

	String description,

	Set<Permission> permissions

) {}
