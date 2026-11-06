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

import com.backend.dto.StockMovementRequest;
import com.backend.dto.StockMovementResponse;
import com.backend.entity.MovementType;
import com.backend.service.StockMovementService;

@RestController
@RequestMapping("/api/stock-movements")
public class StockMovementController {

	private final StockMovementService stockMovementService;

	public StockMovementController(StockMovementService stockMovementService) {
		this.stockMovementService = stockMovementService;
	}

	@GetMapping
	public List<StockMovementResponse> findAll(@RequestParam(required = false) Long productId,
			@RequestParam(required = false) Long locationId, @RequestParam(required = false) MovementType type,
			@RequestParam(required = false) String search) {
		return stockMovementService.findAll(productId, locationId, type, search);
	}

	@GetMapping("/{id}")
	public StockMovementResponse findById(@PathVariable Long id) {
		return stockMovementService.findById(id);
	}

	@PostMapping
	public ResponseEntity<StockMovementResponse> create(@Valid @RequestBody StockMovementRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(stockMovementService.create(request));
	}

	@PutMapping("/{id}")
	public StockMovementResponse update(@PathVariable Long id, @Valid @RequestBody StockMovementRequest request) {
		return stockMovementService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		stockMovementService.delete(id);
		return ResponseEntity.noContent().build();
	}

}
