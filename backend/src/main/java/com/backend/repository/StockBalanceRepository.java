package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.entity.StockBalance;

public interface StockBalanceRepository extends JpaRepository<StockBalance, Long> {

	boolean existsByProductIdAndLocationId(Long productId, Long locationId);

	List<StockBalance> findByProductIdOrderByLocationName(Long productId);

	List<StockBalance> findByLocationIdOrderByProductName(Long locationId);

	List<StockBalance> findByProductNameContainingIgnoreCaseOrderByProductName(String name);

}
