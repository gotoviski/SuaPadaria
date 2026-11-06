package com.backend.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.backend.dto.MeasurementUnitRequest;
import com.backend.dto.MeasurementUnitResponse;
import com.backend.service.MeasurementUnitService;

@RestController
@RequestMapping("/api/measurement-units")
public class MeasurementUnitController {

	private final MeasurementUnitService measurementUnitService;

	public MeasurementUnitController(MeasurementUnitService measurementUnitService) {
		this.measurementUnitService = measurementUnitService;
	}

	@GetMapping
	public List<MeasurementUnitResponse> findAll(@RequestParam(required = false) String search) {
		return measurementUnitService.findAll(search);
	}

	@GetMapping("/{id}")
	public MeasurementUnitResponse findById(@PathVariable Long id) {
		return measurementUnitService.findById(id);
	}

	@PostMapping
	public ResponseEntity<MeasurementUnitResponse> create(@Valid @RequestBody MeasurementUnitRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(measurementUnitService.create(request));
	}

	@PutMapping("/{id}")
	public MeasurementUnitResponse update(@PathVariable Long id, @Valid @RequestBody MeasurementUnitRequest request) {
		return measurementUnitService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		measurementUnitService.delete(id);
		return ResponseEntity.noContent().build();
	}

}
