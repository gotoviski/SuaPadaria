package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.entity.StockMovement;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {

	List<StockMovement> findAllByOrderByMovementDateDesc();

	List<StockMovement> findByProductIdOrderByMovementDateDesc(Long productId);

	List<StockMovement> findByLocationIdOrderByMovementDateDesc(Long locationId);

	List<StockMovement> findByProductNameContainingIgnoreCaseOrderByMovementDateDesc(String productName);

}
