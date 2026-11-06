package com.backend.service;

import java.util.List;

import com.backend.dto.StockBatchRequest;
import com.backend.dto.StockBatchResponse;

public interface StockBatchService {

	List<StockBatchResponse> findAll(Long productId, Long locationId, String search);

	StockBatchResponse findById(Long id);

	StockBatchResponse create(StockBatchRequest request);

	StockBatchResponse update(Long id, StockBatchRequest request);

	void delete(Long id);

}
