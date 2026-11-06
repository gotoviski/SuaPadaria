package com.backend.service;

import java.util.List;

import com.backend.dto.ProductRequest;
import com.backend.dto.ProductResponse;

public interface ProductService {

	List<ProductResponse> findAll(String search);

	ProductResponse findById(Long id);

	ProductResponse create(ProductRequest request);

	ProductResponse update(Long id, ProductRequest request);

	void delete(Long id);

}
