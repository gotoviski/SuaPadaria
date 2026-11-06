package com.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.entity.Company;

public interface CompanyRepository extends JpaRepository<Company, Long> {

	Optional<Company> findTopByOrderByIdAsc();

}
