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

import com.backend.dto.SaleItemRequest;
import com.backend.dto.SaleItemResponse;
import com.backend.service.SaleItemService;

@RestController
@RequestMapping("/api/sale-items")
public class SaleItemController {

	private final SaleItemService saleItemService;

	public SaleItemController(SaleItemService saleItemService) {
		this.saleItemService = saleItemService;
	}

	@GetMapping
	public List<SaleItemResponse> findAll(@RequestParam(required = false) Long saleId,
			@RequestParam(required = false) Long productId, @RequestParam(required = false) String search) {
		return saleItemService.findAll(saleId, productId, search);
	}

	@GetMapping("/{id}")
	public SaleItemResponse findById(@PathVariable Long id) {
		return saleItemService.findById(id);
	}

	@PostMapping
	public ResponseEntity<SaleItemResponse> create(@Valid @RequestBody SaleItemRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(saleItemService.create(request));
	}

	@PutMapping("/{id}")
	public SaleItemResponse update(@PathVariable Long id, @Valid @RequestBody SaleItemRequest request) {
		return saleItemService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		saleItemService.delete(id);
		return ResponseEntity.noContent().build();
	}

}
