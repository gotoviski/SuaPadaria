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

import com.backend.dto.AccountPayableRequest;
import com.backend.dto.AccountPayableResponse;
import com.backend.dto.FinancialSettlementRequest;
import com.backend.entity.PayableStatus;
import com.backend.service.AccountPayableService;

@RestController
@RequestMapping("/api/accounts-payable")
public class AccountPayableController {

	private final AccountPayableService payableService;

	public AccountPayableController(AccountPayableService payableService) {
		this.payableService = payableService;
	}

	@GetMapping
	public List<AccountPayableResponse> findAll(@RequestParam(required = false) PayableStatus status,
			@RequestParam(required = false) Long supplierId) {
		return payableService.findAll(status, supplierId);
	}

	@GetMapping("/{id}")
	public AccountPayableResponse findById(@PathVariable Long id) {
		return payableService.findById(id);
	}

	@PostMapping
	public ResponseEntity<AccountPayableResponse> create(
			@Valid @RequestBody AccountPayableRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(payableService.create(request));
	}

	@PutMapping("/{id}")
	public AccountPayableResponse update(@PathVariable Long id,
			@Valid @RequestBody AccountPayableRequest request) {
		return payableService.update(id, request);
	}

	@PostMapping("/{id}/pay")
	public AccountPayableResponse pay(@PathVariable Long id,
			@RequestBody FinancialSettlementRequest request) {
		return payableService.pay(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		payableService.delete(id);
		return ResponseEntity.noContent().build();
	}

}
