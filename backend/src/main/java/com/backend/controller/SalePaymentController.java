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

import com.backend.dto.SalePaymentRequest;
import com.backend.dto.SalePaymentResponse;
import com.backend.service.SalePaymentService;

@RestController
@RequestMapping("/api/sale-payments")
public class SalePaymentController {

	private final SalePaymentService salePaymentService;

	public SalePaymentController(SalePaymentService salePaymentService) {
		this.salePaymentService = salePaymentService;
	}

	@GetMapping
	public List<SalePaymentResponse> findAll(@RequestParam(required = false) Long saleId) {
		return salePaymentService.findAll(saleId);
	}

	@GetMapping("/{id}")
	public SalePaymentResponse findById(@PathVariable Long id) {
		return salePaymentService.findById(id);
	}

	@PostMapping
	public ResponseEntity<SalePaymentResponse> create(@Valid @RequestBody SalePaymentRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(salePaymentService.create(request));
	}

	@PutMapping("/{id}")
	public SalePaymentResponse update(@PathVariable Long id, @Valid @RequestBody SalePaymentRequest request) {
		return salePaymentService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		salePaymentService.delete(id);
		return ResponseEntity.noContent().build();
	}

}
