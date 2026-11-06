package com.backend.service;

import java.util.List;

import com.backend.dto.StockBalanceRequest;
import com.backend.dto.StockBalanceResponse;

public interface StockBalanceService {

	List<StockBalanceResponse> findAll(Long productId, Long locationId, String search);

	StockBalanceResponse findById(Long id);

	StockBalanceResponse create(StockBalanceRequest request);

	StockBalanceResponse update(Long id, StockBalanceRequest request);

	void delete(Long id);

}
