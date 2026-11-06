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

import com.backend.dto.InventoryItemRequest;
import com.backend.dto.InventoryItemResponse;
import com.backend.service.InventoryItemService;

@RestController
@RequestMapping("/api/inventory-items")
public class InventoryItemController {

	private final InventoryItemService inventoryItemService;

	public InventoryItemController(InventoryItemService inventoryItemService) {
		this.inventoryItemService = inventoryItemService;
	}

	@GetMapping
	public List<InventoryItemResponse> findAll(@RequestParam(required = false) Long inventoryId,
			@RequestParam(required = false) Long productId, @RequestParam(required = false) String search) {
		return inventoryItemService.findAll(inventoryId, productId, search);
	}

	@GetMapping("/{id}")
	public InventoryItemResponse findById(@PathVariable Long id) {
		return inventoryItemService.findById(id);
	}

	@PostMapping
	public ResponseEntity<InventoryItemResponse> create(@Valid @RequestBody InventoryItemRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(inventoryItemService.create(request));
	}

	@PutMapping("/{id}")
	public InventoryItemResponse update(@PathVariable Long id, @Valid @RequestBody InventoryItemRequest request) {
		return inventoryItemService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		inventoryItemService.delete(id);
		return ResponseEntity.noContent().build();
	}

}
