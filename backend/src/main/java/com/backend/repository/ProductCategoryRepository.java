package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.entity.ProductCategory;

public interface ProductCategoryRepository extends JpaRepository<ProductCategory, Long> {

	boolean existsByNameIgnoreCase(String name);

	List<ProductCategory> findByNameContainingIgnoreCaseOrderByName(String name);

}
