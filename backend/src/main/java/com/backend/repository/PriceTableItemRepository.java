package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.entity.PriceTableItem;

public interface PriceTableItemRepository extends JpaRepository<PriceTableItem, Long> {

	boolean existsByPriceTableIdAndProductId(Long priceTableId, Long productId);

	List<PriceTableItem> findByPriceTableIdOrderByProductName(Long priceTableId);

	List<PriceTableItem> findByProductIdOrderByPriceTableName(Long productId);

	List<PriceTableItem> findByProductNameContainingIgnoreCaseOrderByProductName(String name);

}
