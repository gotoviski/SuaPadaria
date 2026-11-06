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

import com.backend.dto.PurchaseItemRequest;
import com.backend.dto.PurchaseItemResponse;
import com.backend.service.PurchaseItemService;

@RestController
@RequestMapping("/api/purchase-items")
public class PurchaseItemController {

	private final PurchaseItemService purchaseItemService;

	public PurchaseItemController(PurchaseItemService purchaseItemService) {
		this.purchaseItemService = purchaseItemService;
	}

	@GetMapping
	public List<PurchaseItemResponse> findAll(@RequestParam(required = false) Long purchaseId,
			@RequestParam(required = false) Long productId, @RequestParam(required = false) String search) {
		return purchaseItemService.findAll(purchaseId, productId, search);
	}

	@GetMapping("/{id}")
	public PurchaseItemResponse findById(@PathVariable Long id) {
		return purchaseItemService.findById(id);
	}

	@PostMapping
	public ResponseEntity<PurchaseItemResponse> create(@Valid @RequestBody PurchaseItemRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(purchaseItemService.create(request));
	}

	@PutMapping("/{id}")
	public PurchaseItemResponse update(@PathVariable Long id, @Valid @RequestBody PurchaseItemRequest request) {
		return purchaseItemService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		purchaseItemService.delete(id);
		return ResponseEntity.noContent().build();
	}

}
