package com.backend.service;

import java.util.List;

import com.backend.dto.InventoryRequest;
import com.backend.dto.InventoryResponse;
import com.backend.entity.InventoryStatus;

public interface InventoryService {

	List<InventoryResponse> findAll(Long locationId, InventoryStatus status, String search);

	InventoryResponse findById(Long id);

	InventoryResponse create(InventoryRequest request);

	InventoryResponse update(Long id, InventoryRequest request);

	void delete(Long id);

}
