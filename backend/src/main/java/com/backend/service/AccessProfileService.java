package com.backend.service;

import java.util.List;

import com.backend.dto.AccessProfileRequest;
import com.backend.dto.AccessProfileResponse;
import com.backend.entity.Permission;

public interface AccessProfileService {

	List<AccessProfileResponse> findAll();

	AccessProfileResponse findById(Long id);

	AccessProfileResponse create(AccessProfileRequest request);

	AccessProfileResponse update(Long id, AccessProfileRequest request);

	void delete(Long id);

	List<Permission> permissions();

}
