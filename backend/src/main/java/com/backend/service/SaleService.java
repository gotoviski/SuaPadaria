package com.backend.service;

import java.util.List;

import com.backend.dto.SaleRequest;
import com.backend.dto.SaleResponse;

public interface SaleService {

	List<SaleResponse> findAll(String search);

	SaleResponse findById(Long id);

	SaleResponse create(SaleRequest request);

	SaleResponse update(Long id, SaleRequest request);

	void delete(Long id);

}
