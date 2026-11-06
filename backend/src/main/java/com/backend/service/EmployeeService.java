package com.backend.service;

import java.util.List;

import com.backend.dto.EmployeeRequest;
import com.backend.dto.EmployeeResponse;

public interface EmployeeService {

	List<EmployeeResponse> findAll(String search);

	EmployeeResponse findById(Long id);

	EmployeeResponse create(EmployeeRequest request);

	EmployeeResponse update(Long id, EmployeeRequest request);

	void delete(Long id);

}
