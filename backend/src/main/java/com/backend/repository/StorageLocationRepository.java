package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.entity.StorageLocation;

public interface StorageLocationRepository extends JpaRepository<StorageLocation, Long> {

	boolean existsByNameIgnoreCase(String name);

	List<StorageLocation> findByNameContainingIgnoreCaseOrderByName(String name);

}
