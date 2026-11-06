package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.entity.SalePayment;

public interface SalePaymentRepository extends JpaRepository<SalePayment, Long> {

	List<SalePayment> findBySaleIdOrderById(Long saleId);

	List<SalePayment> findAllByOrderByIdDesc();

}
