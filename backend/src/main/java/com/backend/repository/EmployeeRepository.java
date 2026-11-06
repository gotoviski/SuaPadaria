package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.entity.Employee;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

	boolean existsByCpf(String cpf);

	List<Employee> findByNameContainingIgnoreCaseOrRoleContainingIgnoreCaseOrPhoneContainingOrderByName(
			String name, String role, String phone);

}
