package com.backend.service;

import java.util.List;

import com.backend.dto.SalePaymentRequest;
import com.backend.dto.SalePaymentResponse;

public interface SalePaymentService {

	List<SalePaymentResponse> findAll(Long saleId);

	SalePaymentResponse findById(Long id);

	SalePaymentResponse create(SalePaymentRequest request);

	SalePaymentResponse update(Long id, SalePaymentRequest request);

	void delete(Long id);

}
