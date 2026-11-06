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

import com.backend.dto.StockBalanceRequest;
import com.backend.dto.StockBalanceResponse;
import com.backend.service.StockBalanceService;

@RestController
@RequestMapping("/api/stock-balances")
public class StockBalanceController {

	private final StockBalanceService stockBalanceService;

	public StockBalanceController(StockBalanceService stockBalanceService) {
		this.stockBalanceService = stockBalanceService;
	}

	@GetMapping
	public List<StockBalanceResponse> findAll(@RequestParam(required = false) Long productId,
			@RequestParam(required = false) Long locationId, @RequestParam(required = false) String search) {
		return stockBalanceService.findAll(productId, locationId, search);
	}

	@GetMapping("/{id}")
	public StockBalanceResponse findById(@PathVariable Long id) {
		return stockBalanceService.findById(id);
	}

	@PostMapping
	public ResponseEntity<StockBalanceResponse> create(@Valid @RequestBody StockBalanceRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(stockBalanceService.create(request));
	}

	@PutMapping("/{id}")
	public StockBalanceResponse update(@PathVariable Long id, @Valid @RequestBody StockBalanceRequest request) {
		return stockBalanceService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		stockBalanceService.delete(id);
		return ResponseEntity.noContent().build();
	}

}
