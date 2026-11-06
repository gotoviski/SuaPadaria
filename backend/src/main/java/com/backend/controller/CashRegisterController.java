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

import com.backend.dto.CashRegisterRequest;
import com.backend.dto.CashRegisterResponse;
import com.backend.service.CashRegisterService;

@RestController
@RequestMapping("/api/cash-registers")
public class CashRegisterController {

	private final CashRegisterService cashRegisterService;

	public CashRegisterController(CashRegisterService cashRegisterService) {
		this.cashRegisterService = cashRegisterService;
	}

	@GetMapping
	public List<CashRegisterResponse> findAll(@RequestParam(required = false) String search) {
		return cashRegisterService.findAll(search);
	}

	@GetMapping("/{id}")
	public CashRegisterResponse findById(@PathVariable Long id) {
		return cashRegisterService.findById(id);
	}

	@PostMapping
	public ResponseEntity<CashRegisterResponse> create(@Valid @RequestBody CashRegisterRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(cashRegisterService.create(request));
	}

	@PutMapping("/{id}")
	public CashRegisterResponse update(@PathVariable Long id, @Valid @RequestBody CashRegisterRequest request) {
		return cashRegisterService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		cashRegisterService.delete(id);
		return ResponseEntity.noContent().build();
	}

}
