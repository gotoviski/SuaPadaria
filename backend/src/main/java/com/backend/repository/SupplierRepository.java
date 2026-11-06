package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.entity.Supplier;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {

	boolean existsByCnpj(String cnpj);

	List<Supplier> findByNameContainingIgnoreCaseOrContactNameContainingIgnoreCaseOrPhoneContainingOrderByName(
			String name, String contactName, String phone);

}
