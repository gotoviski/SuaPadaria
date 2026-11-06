package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.entity.StockBatch;

public interface StockBatchRepository extends JpaRepository<StockBatch, Long> {

	boolean existsByProductIdAndBatchNumberIgnoreCase(Long productId, String batchNumber);

	List<StockBatch> findAllByOrderByExpirationDateAsc();

	List<StockBatch> findByProductIdOrderByExpirationDateAsc(Long productId);

	List<StockBatch> findByLocationIdOrderByExpirationDateAsc(Long locationId);

	List<StockBatch> findByProductNameContainingIgnoreCaseOrBatchNumberContainingIgnoreCaseOrderByExpirationDateAsc(
			String productName, String batchNumber);

}
