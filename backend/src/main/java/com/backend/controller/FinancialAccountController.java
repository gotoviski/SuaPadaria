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

import com.backend.dto.FinancialAccountRequest;
import com.backend.dto.FinancialAccountResponse;
import com.backend.service.FinancialAccountService;

@RestController
@RequestMapping("/api/financial-accounts")
public class FinancialAccountController {

	private final FinancialAccountService accountService;

	public FinancialAccountController(FinancialAccountService accountService) {
		this.accountService = accountService;
	}

	@GetMapping
	public List<FinancialAccountResponse> findAll(@RequestParam(required = false) String search) {
		return accountService.findAll(search);
	}

	@GetMapping("/{id}")
	public FinancialAccountResponse findById(@PathVariable Long id) {
		return accountService.findById(id);
	}

	@PostMapping
	public ResponseEntity<FinancialAccountResponse> create(
			@Valid @RequestBody FinancialAccountRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(accountService.create(request));
	}

	@PutMapping("/{id}")
	public FinancialAccountResponse update(@PathVariable Long id,
			@Valid @RequestBody FinancialAccountRequest request) {
		return accountService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		accountService.delete(id);
		return ResponseEntity.noContent().build();
	}

}
