package com.backend.service;

import java.util.List;

import com.backend.dto.AccountPayableRequest;
import com.backend.dto.AccountPayableResponse;
import com.backend.dto.FinancialSettlementRequest;
import com.backend.entity.PayableStatus;

public interface AccountPayableService {

	List<AccountPayableResponse> findAll(PayableStatus status, Long supplierId);

	AccountPayableResponse findById(Long id);

	AccountPayableResponse create(AccountPayableRequest request);

	AccountPayableResponse update(Long id, AccountPayableRequest request);

	AccountPayableResponse pay(Long id, FinancialSettlementRequest request);

	void delete(Long id);

}
