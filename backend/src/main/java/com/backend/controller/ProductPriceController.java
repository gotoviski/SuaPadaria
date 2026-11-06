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

import com.backend.dto.ProductPriceRequest;
import com.backend.dto.ProductPriceResponse;
import com.backend.service.ProductPriceService;

@RestController
@RequestMapping("/api/product-prices")
public class ProductPriceController {

	private final ProductPriceService productPriceService;

	public ProductPriceController(ProductPriceService productPriceService) {
		this.productPriceService = productPriceService;
	}

	@GetMapping
	public List<ProductPriceResponse> findAll(@RequestParam(required = false) Long priceTableId,
			@RequestParam(required = false) Long productId, @RequestParam(required = false) String search) {
		return productPriceService.findAll(priceTableId, productId, search);
	}

	@GetMapping("/{id}")
	public ProductPriceResponse findById(@PathVariable Long id) {
		return productPriceService.findById(id);
	}

	@PostMapping
	public ResponseEntity<ProductPriceResponse> create(@Valid @RequestBody ProductPriceRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(productPriceService.create(request));
	}

	@PutMapping("/{id}")
	public ProductPriceResponse update(@PathVariable Long id, @Valid @RequestBody ProductPriceRequest request) {
		return productPriceService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		productPriceService.delete(id);
		return ResponseEntity.noContent().build();
	}

}
