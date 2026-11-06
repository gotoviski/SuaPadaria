package com.backend.service;

import java.util.List;

import com.backend.dto.CashRegisterRequest;
import com.backend.dto.CashRegisterResponse;

public interface CashRegisterService {

	List<CashRegisterResponse> findAll(String search);

	CashRegisterResponse findById(Long id);

	CashRegisterResponse create(CashRegisterRequest request);

	CashRegisterResponse update(Long id, CashRegisterRequest request);

	void delete(Long id);

}
