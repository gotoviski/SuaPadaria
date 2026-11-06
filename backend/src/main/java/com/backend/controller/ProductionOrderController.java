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

import com.backend.dto.ProductionOrderRequest;
import com.backend.dto.ProductionOrderResponse;
import com.backend.entity.ProductionStatus;
import com.backend.service.ProductionOrderService;

@RestController
@RequestMapping("/api/production-orders")
public class ProductionOrderController {

	private final ProductionOrderService productionOrderService;

	public ProductionOrderController(ProductionOrderService productionOrderService) {
		this.productionOrderService = productionOrderService;
	}

	@GetMapping
	public List<ProductionOrderResponse> findAll(@RequestParam(required = false) ProductionStatus status,
			@RequestParam(required = false) String search) {
		return productionOrderService.findAll(status, search);
	}

	@GetMapping("/{id}")
	public ProductionOrderResponse findById(@PathVariable Long id) {
		return productionOrderService.findById(id);
	}

	@PostMapping
	public ResponseEntity<ProductionOrderResponse> create(@Valid @RequestBody ProductionOrderRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(productionOrderService.create(request));
	}

	@PutMapping("/{id}")
	public ProductionOrderResponse update(@PathVariable Long id, @Valid @RequestBody ProductionOrderRequest request) {
		return productionOrderService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		productionOrderService.delete(id);
		return ResponseEntity.noContent().build();
	}

}
