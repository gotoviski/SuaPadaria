package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.entity.PriceTable;

public interface PriceTableRepository extends JpaRepository<PriceTable, Long> {

	boolean existsByNameIgnoreCase(String name);

	List<PriceTable> findByNameContainingIgnoreCaseOrderByName(String name);

}
