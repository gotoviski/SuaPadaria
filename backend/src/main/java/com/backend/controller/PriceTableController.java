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

import com.backend.dto.PriceTableRequest;
import com.backend.dto.PriceTableResponse;
import com.backend.service.PriceTableService;

@RestController
@RequestMapping("/api/price-tables")
public class PriceTableController {

	private final PriceTableService priceTableService;

	public PriceTableController(PriceTableService priceTableService) {
		this.priceTableService = priceTableService;
	}

	@GetMapping
	public List<PriceTableResponse> findAll(@RequestParam(required = false) String search) {
		return priceTableService.findAll(search);
	}

	@GetMapping("/{id}")
	public PriceTableResponse findById(@PathVariable Long id) {
		return priceTableService.findById(id);
	}

	@PostMapping
	public ResponseEntity<PriceTableResponse> create(@Valid @RequestBody PriceTableRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(priceTableService.create(request));
	}

	@PutMapping("/{id}")
	public PriceTableResponse update(@PathVariable Long id, @Valid @RequestBody PriceTableRequest request) {
		return priceTableService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		priceTableService.delete(id);
		return ResponseEntity.noContent().build();
	}

}
