package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.entity.InventoryItem;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

	boolean existsByInventoryIdAndProductId(Long inventoryId, Long productId);

	List<InventoryItem> findByInventoryIdOrderByProductName(Long inventoryId);

	List<InventoryItem> findByProductIdOrderByInventoryInventoryDateDesc(Long productId);

	List<InventoryItem> findByProductNameContainingIgnoreCaseOrderByProductName(String name);

}
