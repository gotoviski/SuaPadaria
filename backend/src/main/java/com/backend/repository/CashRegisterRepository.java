package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.entity.CashRegister;

public interface CashRegisterRepository extends JpaRepository<CashRegister, Long> {

	List<CashRegister> findAllByOrderByOpenedAtDesc();

	List<CashRegister> findByEmployeeNameContainingIgnoreCaseOrderByOpenedAtDesc(String name);

}
