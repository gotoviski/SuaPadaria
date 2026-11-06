package com.backend.service;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.StorageLocationRequest;
import com.backend.dto.StorageLocationResponse;
import com.backend.entity.StorageLocation;
import com.backend.repository.StorageLocationRepository;

@Service
@Transactional
public class StorageLocationServiceImpl implements StorageLocationService {

	private final StorageLocationRepository storageLocationRepository;

	public StorageLocationServiceImpl(StorageLocationRepository storageLocationRepository) {
		this.storageLocationRepository = storageLocationRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<StorageLocationResponse> findAll(String search) {
		List<StorageLocation> locations = search == null || search.isBlank()
				? storageLocationRepository.findAll(Sort.by("name"))
				: storageLocationRepository.findByNameContainingIgnoreCaseOrderByName(search);
		return locations.stream().map(StorageLocationResponse::from).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public StorageLocationResponse findById(Long id) {
		return StorageLocationResponse.from(getLocation(id));
	}

	@Override
	public StorageLocationResponse create(StorageLocationRequest request) {
		checkUnique(request, null);
		StorageLocation location = new StorageLocation();
		location.setActive(request.active() == null || request.active());
		apply(location, request);
		return StorageLocationResponse.from(storageLocationRepository.save(location));
	}

	@Override
	public StorageLocationResponse update(Long id, StorageLocationRequest request) {
		StorageLocation location = getLocation(id);
		checkUnique(request, location);
		apply(location, request);
		location.setActive(request.active() == null || request.active());
		return StorageLocationResponse.from(storageLocationRepository.save(location));
	}

	@Override
	public void delete(Long id) {
		storageLocationRepository.delete(getLocation(id));
	}

	private void apply(StorageLocation location, StorageLocationRequest request) {
		location.setName(request.name());
		location.setDescription(request.description());
	}

	private void checkUnique(StorageLocationRequest request, StorageLocation current) {
		if ((current == null || !request.name().equalsIgnoreCase(current.getName()))
				&& storageLocationRepository.existsByNameIgnoreCase(request.name())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Local de estoque já cadastrado");
		}
	}

	private StorageLocation getLocation(Long id) {
		return storageLocationRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
						"Local de estoque não encontrado"));
	}

}
