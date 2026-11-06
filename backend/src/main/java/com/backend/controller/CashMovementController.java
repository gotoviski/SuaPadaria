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

import com.backend.dto.CashMovementRequest;
import com.backend.dto.CashMovementResponse;
import com.backend.service.CashMovementService;

@RestController
@RequestMapping("/api/cash-movements")
public class CashMovementController {

	private final CashMovementService cashMovementService;

	public CashMovementController(CashMovementService cashMovementService) {
		this.cashMovementService = cashMovementService;
	}

	@GetMapping
	public List<CashMovementResponse> findAll(@RequestParam(required = false) Long cashRegisterId) {
		return cashMovementService.findAll(cashRegisterId);
	}

	@GetMapping("/{id}")
	public CashMovementResponse findById(@PathVariable Long id) {
		return cashMovementService.findById(id);
	}

	@PostMapping
	public ResponseEntity<CashMovementResponse> create(@Valid @RequestBody CashMovementRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(cashMovementService.create(request));
	}

	@PutMapping("/{id}")
	public CashMovementResponse update(@PathVariable Long id, @Valid @RequestBody CashMovementRequest request) {
		return cashMovementService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		cashMovementService.delete(id);
		return ResponseEntity.noContent().build();
	}

}
