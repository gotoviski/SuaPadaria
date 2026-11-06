package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.entity.MeasurementUnit;

public interface MeasurementUnitRepository extends JpaRepository<MeasurementUnit, Long> {

	boolean existsByNameIgnoreCase(String name);

	boolean existsByAbbreviationIgnoreCase(String abbreviation);

	List<MeasurementUnit> findByNameContainingIgnoreCaseOrderByName(String name);

}
