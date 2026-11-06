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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.backend.dto.StorageLocationRequest;
import com.backend.dto.StorageLocationResponse;
import com.backend.service.StorageLocationService;

@RestController
@RequestMapping("/api/storage-locations")
public class StorageLocationController {

	private final StorageLocationService storageLocationService;

	public StorageLocationController(StorageLocationService storageLocationService) {
		this.storageLocationService = storageLocationService;
	}

	@GetMapping
	public List<StorageLocationResponse> findAll(@RequestParam(required = false) String search) {
		return storageLocationService.findAll(search);
	}

	@GetMapping("/{id}")
	public StorageLocationResponse findById(@PathVariable Long id) {
		return storageLocationService.findById(id);
	}

	@PostMapping
	public ResponseEntity<StorageLocationResponse> create(@Valid @RequestBody StorageLocationRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(storageLocationService.create(request));
	}

	@PutMapping("/{id}")
	public StorageLocationResponse update(@PathVariable Long id,
			@Valid @RequestBody StorageLocationRequest request) {
		return storageLocationService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		storageLocationService.delete(id);
		return ResponseEntity.noContent().build();
	}

}
