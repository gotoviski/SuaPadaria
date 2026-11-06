package com.backend.service;

import java.util.List;

import com.backend.dto.CashMovementRequest;
import com.backend.dto.CashMovementResponse;

public interface CashMovementService {

	List<CashMovementResponse> findAll(Long cashRegisterId);

	CashMovementResponse findById(Long id);

	CashMovementResponse create(CashMovementRequest request);

	CashMovementResponse update(Long id, CashMovementRequest request);

	void delete(Long id);

}
