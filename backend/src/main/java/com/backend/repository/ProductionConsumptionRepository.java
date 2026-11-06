package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.entity.ProductionConsumption;

public interface ProductionConsumptionRepository extends JpaRepository<ProductionConsumption, Long> {

	List<ProductionConsumption> findByProductionOrderIdOrderByProductName(Long productionOrderId);

	List<ProductionConsumption> findByProductIdOrderByIdDesc(Long productId);

	List<ProductionConsumption> findByProductNameContainingIgnoreCaseOrderByProductName(String name);

	boolean existsByProductionOrderIdAndProductId(Long productionOrderId, Long productId);

}
