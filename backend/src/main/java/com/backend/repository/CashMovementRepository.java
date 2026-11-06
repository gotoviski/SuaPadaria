package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.entity.CashMovement;

public interface CashMovementRepository extends JpaRepository<CashMovement, Long> {

	List<CashMovement> findAllByOrderByMovementDateDesc();

	List<CashMovement> findByCashRegisterIdOrderByMovementDateDesc(Long cashRegisterId);

}
