package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.entity.Inventory;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {

	List<Inventory> findAllByOrderByInventoryDateDesc();

	List<Inventory> findByLocationIdOrderByInventoryDateDesc(Long locationId);

	List<Inventory> findByLocationNameContainingIgnoreCaseOrderByInventoryDateDesc(String locationName);

}
