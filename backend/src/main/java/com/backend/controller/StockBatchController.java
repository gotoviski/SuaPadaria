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

import com.backend.dto.StockBatchRequest;
import com.backend.dto.StockBatchResponse;
import com.backend.service.StockBatchService;

@RestController
@RequestMapping("/api/stock-batches")
public class StockBatchController {

	private final StockBatchService stockBatchService;

	public StockBatchController(StockBatchService stockBatchService) {
		this.stockBatchService = stockBatchService;
	}

	@GetMapping
	public List<StockBatchResponse> findAll(@RequestParam(required = false) Long productId,
			@RequestParam(required = false) Long locationId, @RequestParam(required = false) String search) {
		return stockBatchService.findAll(productId, locationId, search);
	}

	@GetMapping("/{id}")
	public StockBatchResponse findById(@PathVariable Long id) {
		return stockBatchService.findById(id);
	}

	@PostMapping
	public ResponseEntity<StockBatchResponse> create(@Valid @RequestBody StockBatchRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(stockBatchService.create(request));
	}

	@PutMapping("/{id}")
	public StockBatchResponse update(@PathVariable Long id, @Valid @RequestBody StockBatchRequest request) {
		return stockBatchService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		stockBatchService.delete(id);
		return ResponseEntity.noContent().build();
	}

}
