package com.backend.service;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.ProductCategoryRequest;
import com.backend.dto.ProductCategoryResponse;
import com.backend.entity.ProductCategory;
import com.backend.repository.ProductCategoryRepository;

@Service
@Transactional
public class ProductCategoryServiceImpl implements ProductCategoryService {

	private final ProductCategoryRepository productCategoryRepository;

	public ProductCategoryServiceImpl(ProductCategoryRepository productCategoryRepository) {
		this.productCategoryRepository = productCategoryRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<ProductCategoryResponse> findAll(String search) {
		List<ProductCategory> categories = search == null || search.isBlank()
				? productCategoryRepository.findAll(Sort.by("name"))
				: productCategoryRepository.findByNameContainingIgnoreCaseOrderByName(search);
		return categories.stream().map(ProductCategoryResponse::from).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public ProductCategoryResponse findById(Long id) {
		return ProductCategoryResponse.from(getCategory(id));
	}

	@Override
	public ProductCategoryResponse create(ProductCategoryRequest request) {
		if (productCategoryRepository.existsByNameIgnoreCase(request.name())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Categoria já cadastrada");
		}
		ProductCategory category = new ProductCategory();
		category.setActive(request.active() == null || request.active());
		apply(category, request);
		return ProductCategoryResponse.from(productCategoryRepository.save(category));
	}

	@Override
	public ProductCategoryResponse update(Long id, ProductCategoryRequest request) {
		ProductCategory category = getCategory(id);
		if (!request.name().equalsIgnoreCase(category.getName())
				&& productCategoryRepository.existsByNameIgnoreCase(request.name())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Categoria já cadastrada");
		}
		apply(category, request);
		category.setActive(request.active() == null || request.active());
		return ProductCategoryResponse.from(productCategoryRepository.save(category));
	}

	@Override
	public void delete(Long id) {
		productCategoryRepository.delete(getCategory(id));
	}

	private void apply(ProductCategory category, ProductCategoryRequest request) {
		category.setName(request.name());
		category.setDescription(request.description());
	}

	private ProductCategory getCategory(Long id) {
		return productCategoryRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria não encontrada"));
	}

}
