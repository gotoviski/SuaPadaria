package com.backend.service;

import java.util.List;

import com.backend.dto.MeasurementUnitRequest;
import com.backend.dto.MeasurementUnitResponse;

public interface MeasurementUnitService {

	List<MeasurementUnitResponse> findAll(String search);

	MeasurementUnitResponse findById(Long id);

	MeasurementUnitResponse create(MeasurementUnitRequest request);

	MeasurementUnitResponse update(Long id, MeasurementUnitRequest request);

	void delete(Long id);

}
