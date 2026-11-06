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

import com.backend.dto.ProductCategoryRequest;
import com.backend.dto.ProductCategoryResponse;
import com.backend.service.ProductCategoryService;

@RestController
@RequestMapping("/api/product-categories")
public class ProductCategoryController {

	private final ProductCategoryService productCategoryService;

	public ProductCategoryController(ProductCategoryService productCategoryService) {
		this.productCategoryService = productCategoryService;
	}

	@GetMapping
	public List<ProductCategoryResponse> findAll(@RequestParam(required = false) String search) {
		return productCategoryService.findAll(search);
	}

	@GetMapping("/{id}")
	public ProductCategoryResponse findById(@PathVariable Long id) {
		return productCategoryService.findById(id);
	}

	@PostMapping
	public ResponseEntity<ProductCategoryResponse> create(@Valid @RequestBody ProductCategoryRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(productCategoryService.create(request));
	}

	@PutMapping("/{id}")
	public ProductCategoryResponse update(@PathVariable Long id, @Valid @RequestBody ProductCategoryRequest request) {
		return productCategoryService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		productCategoryService.delete(id);
		return ResponseEntity.noContent().build();
	}

}
