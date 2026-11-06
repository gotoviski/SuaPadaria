package com.backend.service;

import java.util.List;

import com.backend.dto.StockMovementRequest;
import com.backend.dto.StockMovementResponse;
import com.backend.entity.MovementType;

public interface StockMovementService {

	List<StockMovementResponse> findAll(Long productId, Long locationId, MovementType type, String search);

	StockMovementResponse findById(Long id);

	StockMovementResponse create(StockMovementRequest request);

	StockMovementResponse update(Long id, StockMovementRequest request);

	void delete(Long id);

}
