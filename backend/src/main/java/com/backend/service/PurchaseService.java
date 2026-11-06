package com.backend.service;

import java.util.List;

import com.backend.dto.PurchaseRequest;
import com.backend.dto.PurchaseResponse;

public interface PurchaseService {

	List<PurchaseResponse> findAll(String search);

	PurchaseResponse findById(Long id);

	PurchaseResponse create(PurchaseRequest request);

	PurchaseResponse update(Long id, PurchaseRequest request);

	void delete(Long id);

}
