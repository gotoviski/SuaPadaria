package com.backend.service;

import java.util.List;

import com.backend.dto.InventoryItemRequest;
import com.backend.dto.InventoryItemResponse;

public interface InventoryItemService {

	List<InventoryItemResponse> findAll(Long inventoryId, Long productId, String search);

	InventoryItemResponse findById(Long id);

	InventoryItemResponse create(InventoryItemRequest request);

	InventoryItemResponse update(Long id, InventoryItemRequest request);

	void delete(Long id);

}
