package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.entity.ProductionOrder;
import com.backend.entity.ProductionStatus;

public interface ProductionOrderRepository extends JpaRepository<ProductionOrder, Long> {

	List<ProductionOrder> findAllByOrderByCreatedAtDesc();

	List<ProductionOrder> findByRecipeProductNameContainingIgnoreCaseOrderByCreatedAtDesc(String name);

	List<ProductionOrder> findByStatusOrderByCreatedAtDesc(ProductionStatus status);

}
