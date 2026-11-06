package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.entity.SaleItem;

public interface SaleItemRepository extends JpaRepository<SaleItem, Long> {

	boolean existsBySaleIdAndProductId(Long saleId, Long productId);

	List<SaleItem> findBySaleIdOrderByProductName(Long saleId);

	List<SaleItem> findByProductIdOrderBySaleSaleDateDesc(Long productId);

	List<SaleItem> findByProductNameContainingIgnoreCaseOrderByProductName(String name);

}
