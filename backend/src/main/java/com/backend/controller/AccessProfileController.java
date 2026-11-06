package com.backend.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.backend.dto.AccessProfileRequest;
import com.backend.dto.AccessProfileResponse;
import com.backend.entity.Permission;
import com.backend.service.AccessProfileService;

@RestController
@RequestMapping("/api/profiles")
public class AccessProfileController {

	private final AccessProfileService profileService;

	public AccessProfileController(AccessProfileService profileService) {
		this.profileService = profileService;
	}

	@GetMapping
	public List<AccessProfileResponse> findAll() {
		return profileService.findAll();
	}

	@GetMapping("/permissions")
	public List<Permission> permissions() {
		return profileService.permissions();
	}

	@GetMapping("/{id}")
	public AccessProfileResponse findById(@PathVariable Long id) {
		return profileService.findById(id);
	}

	@PostMapping
	public ResponseEntity<AccessProfileResponse> create(@Valid @RequestBody AccessProfileRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(profileService.create(request));
	}

	@PutMapping("/{id}")
	public AccessProfileResponse update(@PathVariable Long id, @Valid @RequestBody AccessProfileRequest request) {
		return profileService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		profileService.delete(id);
		return ResponseEntity.noContent().build();
	}

}
