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

import com.backend.dto.PurchaseRequest;
import com.backend.dto.PurchaseResponse;
import com.backend.service.PurchaseService;

@RestController
@RequestMapping("/api/purchases")
public class PurchaseController {

	private final PurchaseService purchaseService;

	public PurchaseController(PurchaseService purchaseService) {
		this.purchaseService = purchaseService;
	}

	@GetMapping
	public List<PurchaseResponse> findAll(@RequestParam(required = false) String search) {
		return purchaseService.findAll(search);
	}

	@GetMapping("/{id}")
	public PurchaseResponse findById(@PathVariable Long id) {
		return purchaseService.findById(id);
	}

	@PostMapping
	public ResponseEntity<PurchaseResponse> create(@Valid @RequestBody PurchaseRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(purchaseService.create(request));
	}

	@PutMapping("/{id}")
	public PurchaseResponse update(@PathVariable Long id, @Valid @RequestBody PurchaseRequest request) {
		return purchaseService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		purchaseService.delete(id);
		return ResponseEntity.noContent().build();
	}

}
