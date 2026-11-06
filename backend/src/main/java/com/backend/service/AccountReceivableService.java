package com.backend.service;

import java.util.List;

import com.backend.dto.AccountReceivableRequest;
import com.backend.dto.AccountReceivableResponse;
import com.backend.dto.FinancialSettlementRequest;
import com.backend.entity.ReceivableStatus;

public interface AccountReceivableService {

	List<AccountReceivableResponse> findAll(ReceivableStatus status, Long customerId);

	AccountReceivableResponse findById(Long id);

	AccountReceivableResponse create(AccountReceivableRequest request);

	AccountReceivableResponse update(Long id, AccountReceivableRequest request);

	AccountReceivableResponse receive(Long id, FinancialSettlementRequest request);

	void delete(Long id);

}
