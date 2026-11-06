package com.backend.service;

import java.util.List;

import com.backend.dto.PriceTableRequest;
import com.backend.dto.PriceTableResponse;

public interface PriceTableService {

	List<PriceTableResponse> findAll(String search);

	PriceTableResponse findById(Long id);

	PriceTableResponse create(PriceTableRequest request);

	PriceTableResponse update(Long id, PriceTableRequest request);

	void delete(Long id);

}
