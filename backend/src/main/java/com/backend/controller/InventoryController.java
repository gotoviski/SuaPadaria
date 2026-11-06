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

import com.backend.dto.InventoryRequest;
import com.backend.dto.InventoryResponse;
import com.backend.entity.InventoryStatus;
import com.backend.service.InventoryService;

@RestController
@RequestMapping("/api/inventories")
public class InventoryController {

	private final InventoryService inventoryService;

	public InventoryController(InventoryService inventoryService) {
		this.inventoryService = inventoryService;
	}

	@GetMapping
	public List<InventoryResponse> findAll(@RequestParam(required = false) Long locationId,
			@RequestParam(required = false) InventoryStatus status,
			@RequestParam(required = false) String search) {
		return inventoryService.findAll(locationId, status, search);
	}

	@GetMapping("/{id}")
	public InventoryResponse findById(@PathVariable Long id) {
		return inventoryService.findById(id);
	}

	@PostMapping
	public ResponseEntity<InventoryResponse> create(@Valid @RequestBody InventoryRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(inventoryService.create(request));
	}

	@PutMapping("/{id}")
	public InventoryResponse update(@PathVariable Long id, @Valid @RequestBody InventoryRequest request) {
		return inventoryService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		inventoryService.delete(id);
		return ResponseEntity.noContent().build();
	}

}
