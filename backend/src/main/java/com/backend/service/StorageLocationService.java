package com.backend.service;

import java.util.List;

import com.backend.dto.StorageLocationRequest;
import com.backend.dto.StorageLocationResponse;

public interface StorageLocationService {

	List<StorageLocationResponse> findAll(String search);

	StorageLocationResponse findById(Long id);

	StorageLocationResponse create(StorageLocationRequest request);

	StorageLocationResponse update(Long id, StorageLocationRequest request);

	void delete(Long id);

}
