package com.backend.service;

import java.util.List;

import com.backend.dto.ProductionOrderRequest;
import com.backend.dto.ProductionOrderResponse;
import com.backend.entity.ProductionStatus;

public interface ProductionOrderService {

	List<ProductionOrderResponse> findAll(ProductionStatus status, String search);

	ProductionOrderResponse findById(Long id);

	ProductionOrderResponse create(ProductionOrderRequest request);

	ProductionOrderResponse update(Long id, ProductionOrderRequest request);

	void delete(Long id);

}
