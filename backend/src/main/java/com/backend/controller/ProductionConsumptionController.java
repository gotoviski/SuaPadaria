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

import com.backend.dto.ProductionConsumptionRequest;
import com.backend.dto.ProductionConsumptionResponse;
import com.backend.service.ProductionConsumptionService;

@RestController
@RequestMapping("/api/production-consumptions")
public class ProductionConsumptionController {

	private final ProductionConsumptionService productionConsumptionService;

	public ProductionConsumptionController(ProductionConsumptionService productionConsumptionService) {
		this.productionConsumptionService = productionConsumptionService;
	}

	@GetMapping
	public List<ProductionConsumptionResponse> findAll(@RequestParam(required = false) Long orderId,
			@RequestParam(required = false) Long productId, @RequestParam(required = false) String search) {
		return productionConsumptionService.findAll(orderId, productId, search);
	}

	@GetMapping("/{id}")
	public ProductionConsumptionResponse findById(@PathVariable Long id) {
		return productionConsumptionService.findById(id);
	}

	@PostMapping
	public ResponseEntity<ProductionConsumptionResponse> create(
			@Valid @RequestBody ProductionConsumptionRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(productionConsumptionService.create(request));
	}

	@PutMapping("/{id}")
	public ProductionConsumptionResponse update(@PathVariable Long id,
			@Valid @RequestBody ProductionConsumptionRequest request) {
		return productionConsumptionService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		productionConsumptionService.delete(id);
		return ResponseEntity.noContent().build();
	}

}
