package com.backend.service;

import java.util.List;

import com.backend.dto.FinancialAccountRequest;
import com.backend.dto.FinancialAccountResponse;

public interface FinancialAccountService {

	List<FinancialAccountResponse> findAll(String search);

	FinancialAccountResponse findById(Long id);

	FinancialAccountResponse create(FinancialAccountRequest request);

	FinancialAccountResponse update(Long id, FinancialAccountRequest request);

	void delete(Long id);

}
