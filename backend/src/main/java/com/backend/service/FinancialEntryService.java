package com.backend.service;

import java.util.List;

import com.backend.dto.FinancialEntryRequest;
import com.backend.dto.FinancialEntryResponse;

public interface FinancialEntryService {

	List<FinancialEntryResponse> findAll(Long financialAccountId);

	FinancialEntryResponse findById(Long id);

	FinancialEntryResponse create(FinancialEntryRequest request);

	FinancialEntryResponse update(Long id, FinancialEntryRequest request);

	void delete(Long id);

}
