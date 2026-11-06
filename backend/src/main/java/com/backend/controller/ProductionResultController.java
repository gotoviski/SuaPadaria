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

import com.backend.dto.ProductionResultRequest;
import com.backend.dto.ProductionResultResponse;
import com.backend.service.ProductionResultService;

@RestController
@RequestMapping("/api/production-results")
public class ProductionResultController {

	private final ProductionResultService productionResultService;

	public ProductionResultController(ProductionResultService productionResultService) {
		this.productionResultService = productionResultService;
	}

	@GetMapping
	public List<ProductionResultResponse> findAll(@RequestParam(required = false) Long orderId,
			@RequestParam(required = false) Long productId, @RequestParam(required = false) String search) {
		return productionResultService.findAll(orderId, productId, search);
	}

	@GetMapping("/{id}")
	public ProductionResultResponse findById(@PathVariable Long id) {
		return productionResultService.findById(id);
	}

	@PostMapping
	public ResponseEntity<ProductionResultResponse> create(@Valid @RequestBody ProductionResultRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(productionResultService.create(request));
	}

	@PutMapping("/{id}")
	public ProductionResultResponse update(@PathVariable Long id, @Valid @RequestBody ProductionResultRequest request) {
		return productionResultService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		productionResultService.delete(id);
		return ResponseEntity.noContent().build();
	}

}
