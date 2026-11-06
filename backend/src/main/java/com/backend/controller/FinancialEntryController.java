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

import com.backend.dto.FinancialEntryRequest;
import com.backend.dto.FinancialEntryResponse;
import com.backend.service.FinancialEntryService;

@RestController
@RequestMapping("/api/financial-entries")
public class FinancialEntryController {

	private final FinancialEntryService entryService;

	public FinancialEntryController(FinancialEntryService entryService) {
		this.entryService = entryService;
	}

	@GetMapping
	public List<FinancialEntryResponse> findAll(
			@RequestParam(required = false) Long financialAccountId) {
		return entryService.findAll(financialAccountId);
	}

	@GetMapping("/{id}")
	public FinancialEntryResponse findById(@PathVariable Long id) {
		return entryService.findById(id);
	}

	@PostMapping
	public ResponseEntity<FinancialEntryResponse> create(
			@Valid @RequestBody FinancialEntryRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(entryService.create(request));
	}

	@PutMapping("/{id}")
	public FinancialEntryResponse update(@PathVariable Long id,
			@Valid @RequestBody FinancialEntryRequest request) {
		return entryService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		entryService.delete(id);
		return ResponseEntity.noContent().build();
	}

}
