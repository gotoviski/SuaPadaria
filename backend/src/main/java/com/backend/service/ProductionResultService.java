package com.backend.service;

import java.util.List;

import com.backend.dto.ProductionResultRequest;
import com.backend.dto.ProductionResultResponse;

public interface ProductionResultService {

	List<ProductionResultResponse> findAll(Long orderId, Long productId, String search);

	ProductionResultResponse findById(Long id);

	ProductionResultResponse create(ProductionResultRequest request);

	ProductionResultResponse update(Long id, ProductionResultRequest request);

	void delete(Long id);

}
