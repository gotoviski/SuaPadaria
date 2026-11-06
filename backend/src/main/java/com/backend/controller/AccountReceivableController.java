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

import com.backend.dto.AccountReceivableRequest;
import com.backend.dto.AccountReceivableResponse;
import com.backend.dto.FinancialSettlementRequest;
import com.backend.entity.ReceivableStatus;
import com.backend.service.AccountReceivableService;

@RestController
@RequestMapping("/api/accounts-receivable")
public class AccountReceivableController {

	private final AccountReceivableService receivableService;

	public AccountReceivableController(AccountReceivableService receivableService) {
		this.receivableService = receivableService;
	}

	@GetMapping
	public List<AccountReceivableResponse> findAll(@RequestParam(required = false) ReceivableStatus status,
			@RequestParam(required = false) Long customerId) {
		return receivableService.findAll(status, customerId);
	}

	@GetMapping("/{id}")
	public AccountReceivableResponse findById(@PathVariable Long id) {
		return receivableService.findById(id);
	}

	@PostMapping
	public ResponseEntity<AccountReceivableResponse> create(
			@Valid @RequestBody AccountReceivableRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(receivableService.create(request));
	}

	@PutMapping("/{id}")
	public AccountReceivableResponse update(@PathVariable Long id,
			@Valid @RequestBody AccountReceivableRequest request) {
		return receivableService.update(id, request);
	}

	@PostMapping("/{id}/receive")
	public AccountReceivableResponse receive(@PathVariable Long id,
			@RequestBody FinancialSettlementRequest request) {
		return receivableService.receive(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		receivableService.delete(id);
		return ResponseEntity.noContent().build();
	}

}
