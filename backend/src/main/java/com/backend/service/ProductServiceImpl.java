package com.backend.service;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.ProductRequest;
import com.backend.dto.ProductResponse;
import com.backend.entity.Product;
import com.backend.repository.ProductRepository;

@Service
@Transactional
public class ProductServiceImpl implements ProductService {

	private final ProductRepository productRepository;

	public ProductServiceImpl(ProductRepository productRepository) {
		this.productRepository = productRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<ProductResponse> findAll(String search) {
		List<Product> products = search == null || search.isBlank()
				? productRepository.findAll(Sort.by("name"))
				: productRepository
						.findByNameContainingIgnoreCaseOrCategoryContainingIgnoreCaseOrSkuContainingIgnoreCaseOrderByName(
								search, search, search);
		return products.stream().map(ProductResponse::from).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public ProductResponse findById(Long id) {
		return ProductResponse.from(getProduct(id));
	}

	@Override
	public ProductResponse create(ProductRequest request) {
		if (request.sku() != null && productRepository.existsBySku(request.sku())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "SKU já cadastrado");
		}
		Product product = new Product();
		product.setActive(request.active() == null || request.active());
		apply(product, request);
		return ProductResponse.from(productRepository.save(product));
	}

	@Override
	public ProductResponse update(Long id, ProductRequest request) {
		Product product = getProduct(id);
		if (request.sku() != null && !request.sku().equals(product.getSku())
				&& productRepository.existsBySku(request.sku())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "SKU já cadastrado");
		}
		apply(product, request);
		product.setActive(request.active() == null || request.active());
		return ProductResponse.from(productRepository.save(product));
	}

	@Override
	public void delete(Long id) {
		productRepository.delete(getProduct(id));
	}

	private void apply(Product product, ProductRequest request) {
		product.setName(request.name());
		product.setDescription(request.description());
		product.setCategory(request.category());
		product.setUnit(request.unit());
		product.setPrice(request.price());
		product.setSku(request.sku());
		product.setNotes(request.notes());
	}

	private Product getProduct(Long id) {
		return productRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado"));
	}

}
