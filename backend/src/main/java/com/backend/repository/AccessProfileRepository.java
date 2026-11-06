package com.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.entity.AccessProfile;

public interface AccessProfileRepository extends JpaRepository<AccessProfile, Long> {

	boolean existsByName(String name);

}
