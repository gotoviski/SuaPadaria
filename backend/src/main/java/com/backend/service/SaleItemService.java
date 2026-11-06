package com.backend.service;

import java.util.List;

import com.backend.dto.SaleItemRequest;
import com.backend.dto.SaleItemResponse;

public interface SaleItemService {

	List<SaleItemResponse> findAll(Long saleId, Long productId, String search);

	SaleItemResponse findById(Long id);

	SaleItemResponse create(SaleItemRequest request);

	SaleItemResponse update(Long id, SaleItemRequest request);

	void delete(Long id);

}
