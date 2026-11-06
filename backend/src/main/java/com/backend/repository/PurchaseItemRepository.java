package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.entity.PurchaseItem;

public interface PurchaseItemRepository extends JpaRepository<PurchaseItem, Long> {

	boolean existsByPurchaseIdAndProductId(Long purchaseId, Long productId);

	List<PurchaseItem> findByPurchaseIdOrderByProductName(Long purchaseId);

	List<PurchaseItem> findByProductIdOrderByPurchasePurchaseDateDesc(Long productId);

	List<PurchaseItem> findByProductNameContainingIgnoreCaseOrderByProductName(String name);

}
