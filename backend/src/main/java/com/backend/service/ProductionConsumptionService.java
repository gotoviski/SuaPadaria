package com.backend.service;

import java.util.List;

import com.backend.dto.ProductionConsumptionRequest;
import com.backend.dto.ProductionConsumptionResponse;

public interface ProductionConsumptionService {

	List<ProductionConsumptionResponse> findAll(Long orderId, Long productId, String search);

	ProductionConsumptionResponse findById(Long id);

	ProductionConsumptionResponse create(ProductionConsumptionRequest request);

	ProductionConsumptionResponse update(Long id, ProductionConsumptionRequest request);

	void delete(Long id);

}
