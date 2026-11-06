package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.entity.Purchase;

public interface PurchaseRepository extends JpaRepository<Purchase, Long> {

	List<Purchase> findAllByOrderByPurchaseDateDesc();

	List<Purchase> findBySupplierNameContainingIgnoreCaseOrderByPurchaseDateDesc(String name);

}
