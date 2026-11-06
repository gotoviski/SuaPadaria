package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.entity.Customer;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

	boolean existsByCpf(String cpf);

	List<Customer> findByNameContainingIgnoreCaseOrPhoneContainingOrderByName(String name, String phone);

}
