package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.entity.Sale;

public interface SaleRepository extends JpaRepository<Sale, Long> {

	List<Sale> findAllByOrderBySaleDateDesc();

	List<Sale> findByCustomerNameContainingIgnoreCaseOrderBySaleDateDesc(String name);

	List<Sale> findByCashRegisterIdOrderBySaleDateDesc(Long cashRegisterId);

}
