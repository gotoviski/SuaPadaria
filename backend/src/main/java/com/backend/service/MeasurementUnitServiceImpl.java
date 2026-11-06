package com.backend.service;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.MeasurementUnitRequest;
import com.backend.dto.MeasurementUnitResponse;
import com.backend.entity.MeasurementUnit;
import com.backend.repository.MeasurementUnitRepository;

@Service
@Transactional
public class MeasurementUnitServiceImpl implements MeasurementUnitService {

	private final MeasurementUnitRepository measurementUnitRepository;

	public MeasurementUnitServiceImpl(MeasurementUnitRepository measurementUnitRepository) {
		this.measurementUnitRepository = measurementUnitRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<MeasurementUnitResponse> findAll(String search) {
		List<MeasurementUnit> units = search == null || search.isBlank()
				? measurementUnitRepository.findAll(Sort.by("name"))
				: measurementUnitRepository.findByNameContainingIgnoreCaseOrderByName(search);
		return units.stream().map(MeasurementUnitResponse::from).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public MeasurementUnitResponse findById(Long id) {
		return MeasurementUnitResponse.from(getUnit(id));
	}

	@Override
	public MeasurementUnitResponse create(MeasurementUnitRequest request) {
		checkUnique(request, null);
		MeasurementUnit unit = new MeasurementUnit();
		unit.setActive(request.active() == null || request.active());
		apply(unit, request);
		return MeasurementUnitResponse.from(measurementUnitRepository.save(unit));
	}

	@Override
	public MeasurementUnitResponse update(Long id, MeasurementUnitRequest request) {
		MeasurementUnit unit = getUnit(id);
		checkUnique(request, unit);
		apply(unit, request);
		unit.setActive(request.active() == null || request.active());
		return MeasurementUnitResponse.from(measurementUnitRepository.save(unit));
	}

	@Override
	public void delete(Long id) {
		measurementUnitRepository.delete(getUnit(id));
	}

	private void apply(MeasurementUnit unit, MeasurementUnitRequest request) {
		unit.setName(request.name());
		unit.setAbbreviation(request.abbreviation());
	}

	private void checkUnique(MeasurementUnitRequest request, MeasurementUnit current) {
		if ((current == null || !request.name().equalsIgnoreCase(current.getName()))
				&& measurementUnitRepository.existsByNameIgnoreCase(request.name())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Unidade de medida já cadastrada");
		}
		if ((current == null || !request.abbreviation().equalsIgnoreCase(current.getAbbreviation()))
				&& measurementUnitRepository.existsByAbbreviationIgnoreCase(request.abbreviation())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Sigla já cadastrada");
		}
	}

	private MeasurementUnit getUnit(Long id) {
		return measurementUnitRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
						"Unidade de medida não encontrada"));
	}

}
