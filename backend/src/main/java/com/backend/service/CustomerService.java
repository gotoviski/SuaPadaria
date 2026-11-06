package com.backend.service;

import java.util.List;

import com.backend.dto.CustomerRequest;
import com.backend.dto.CustomerResponse;

public interface CustomerService {

	List<CustomerResponse> findAll(String search);

	CustomerResponse findById(Long id);

	CustomerResponse create(CustomerRequest request);

	CustomerResponse update(Long id, CustomerRequest request);

	void delete(Long id);

}
