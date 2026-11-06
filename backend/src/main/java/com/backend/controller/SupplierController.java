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

import com.backend.dto.SupplierRequest;
import com.backend.dto.SupplierResponse;
import com.backend.service.SupplierService;

@RestController
@RequestMapping("/api/suppliers")
public class SupplierController {

	private final SupplierService supplierService;

	public SupplierController(SupplierService supplierService) {
		this.supplierService = supplierService;
	}

	@GetMapping
	public List<SupplierResponse> findAll(@RequestParam(required = false) String search) {
		return supplierService.findAll(search);
	}

	@GetMapping("/{id}")
	public SupplierResponse findById(@PathVariable Long id) {
		return supplierService.findById(id);
	}

	@PostMapping
	public ResponseEntity<SupplierResponse> create(@Valid @RequestBody SupplierRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(supplierService.create(request));
	}

	@PutMapping("/{id}")
	public SupplierResponse update(@PathVariable Long id, @Valid @RequestBody SupplierRequest request) {
		return supplierService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		supplierService.delete(id);
		return ResponseEntity.noContent().build();
	}

}
