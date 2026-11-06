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

import com.backend.dto.SaleRequest;
import com.backend.dto.SaleResponse;
import com.backend.service.SaleService;

@RestController
@RequestMapping("/api/sales")
public class SaleController {

	private final SaleService saleService;

	public SaleController(SaleService saleService) {
		this.saleService = saleService;
	}

	@GetMapping
	public List<SaleResponse> findAll(@RequestParam(required = false) String search) {
		return saleService.findAll(search);
	}

	@GetMapping("/{id}")
	public SaleResponse findById(@PathVariable Long id) {
		return saleService.findById(id);
	}

	@PostMapping
	public ResponseEntity<SaleResponse> create(@Valid @RequestBody SaleRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(saleService.create(request));
	}

	@PutMapping("/{id}")
	public SaleResponse update(@PathVariable Long id, @Valid @RequestBody SaleRequest request) {
		return saleService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		saleService.delete(id);
		return ResponseEntity.noContent().build();
	}

}
