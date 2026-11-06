package com.backend.service;

import java.util.List;

import com.backend.dto.PurchaseItemRequest;
import com.backend.dto.PurchaseItemResponse;

public interface PurchaseItemService {

	List<PurchaseItemResponse> findAll(Long purchaseId, Long productId, String search);

	PurchaseItemResponse findById(Long id);

	PurchaseItemResponse create(PurchaseItemRequest request);

	PurchaseItemResponse update(Long id, PurchaseItemRequest request);

	void delete(Long id);

}
