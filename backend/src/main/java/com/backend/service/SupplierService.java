package com.backend.service;

import java.util.List;

import com.backend.dto.SupplierRequest;
import com.backend.dto.SupplierResponse;

public interface SupplierService {

	List<SupplierResponse> findAll(String search);

	SupplierResponse findById(Long id);

	SupplierResponse create(SupplierRequest request);

	SupplierResponse update(Long id, SupplierRequest request);

	void delete(Long id);

}
