package com.backend.service;

import java.util.List;

import com.backend.dto.ProductCategoryRequest;
import com.backend.dto.ProductCategoryResponse;

public interface ProductCategoryService {

	List<ProductCategoryResponse> findAll(String search);

	ProductCategoryResponse findById(Long id);

	ProductCategoryResponse create(ProductCategoryRequest request);

	ProductCategoryResponse update(Long id, ProductCategoryRequest request);

	void delete(Long id);

}
