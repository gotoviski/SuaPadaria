package com.backend.service;

import java.util.List;

import com.backend.dto.ProductPriceRequest;
import com.backend.dto.ProductPriceResponse;

public interface ProductPriceService {

	List<ProductPriceResponse> findAll(Long priceTableId, Long productId, String search);

	ProductPriceResponse findById(Long id);

	ProductPriceResponse create(ProductPriceRequest request);

	ProductPriceResponse update(Long id, ProductPriceRequest request);

	void delete(Long id);

}
