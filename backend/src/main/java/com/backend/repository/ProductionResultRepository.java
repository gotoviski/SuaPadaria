package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.entity.ProductionResult;

public interface ProductionResultRepository extends JpaRepository<ProductionResult, Long> {

	List<ProductionResult> findByProductionOrderIdOrderByProductName(Long productionOrderId);

	List<ProductionResult> findByProductIdOrderByIdDesc(Long productId);

	List<ProductionResult> findByProductNameContainingIgnoreCaseOrderByProductName(String name);

	boolean existsByProductionOrderIdAndProductId(Long productionOrderId, Long productId);

}
