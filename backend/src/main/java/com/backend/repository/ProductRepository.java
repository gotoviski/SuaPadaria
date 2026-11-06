package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.entity.Product;

public interface ProductRepository extends JpaRepository<Product, Long> {

	boolean existsBySku(String sku);

	List<Product> findByNameContainingIgnoreCaseOrCategoryContainingIgnoreCaseOrSkuContainingIgnoreCaseOrderByName(
			String name, String category, String sku);

}
