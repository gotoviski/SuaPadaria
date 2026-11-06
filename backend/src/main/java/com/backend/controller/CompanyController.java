package com.backend.controller;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.backend.dto.CompanyRequest;
import com.backend.dto.CompanyResponse;
import com.backend.service.CompanyService;

@RestController
@RequestMapping("/api/company")
public class CompanyController {

	private final CompanyService companyService;

	public CompanyController(CompanyService companyService) {
		this.companyService = companyService;
	}

	@GetMapping
	public CompanyResponse find() {
		return companyService.find();
	}

	@PutMapping
	public CompanyResponse save(@Valid @RequestBody CompanyRequest request) {
		return companyService.save(request);
	}

	@DeleteMapping
	public ResponseEntity<Void> delete() {
		companyService.delete();
		return ResponseEntity.noContent().build();
	}

}
