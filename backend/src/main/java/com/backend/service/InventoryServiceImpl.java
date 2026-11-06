package com.backend.service;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.InventoryItemRequest;
import com.backend.dto.InventoryRequest;
import com.backend.dto.InventoryResponse;
import com.backend.entity.Inventory;
import com.backend.entity.InventoryItem;
import com.backend.entity.InventoryStatus;
import com.backend.entity.Product;
import com.backend.entity.StorageLocation;
import com.backend.repository.InventoryRepository;
import com.backend.repository.ProductRepository;
import com.backend.repository.StorageLocationRepository;

@Service
@Transactional
public class InventoryServiceImpl implements InventoryService {

	private final InventoryRepository inventoryRepository;

	private final StorageLocationRepository storageLocationRepository;

	private final ProductRepository productRepository;

	public InventoryServiceImpl(InventoryRepository inventoryRepository,
			StorageLocationRepository storageLocationRepository, ProductRepository productRepository) {
		this.inventoryRepository = inventoryRepository;
		this.storageLocationRepository = storageLocationRepository;
		this.productRepository = productRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<InventoryResponse> findAll(Long locationId, InventoryStatus status, String search) {
		List<Inventory> inventories;
		if (locationId != null) {
			inventories = inventoryRepository.findByLocationIdOrderByInventoryDateDesc(locationId);
		}
		else if (search != null && !search.isBlank()) {
			inventories = inventoryRepository
					.findByLocationNameContainingIgnoreCaseOrderByInventoryDateDesc(search);
		}
		else {
			inventories = inventoryRepository.findAllByOrderByInventoryDateDesc();
		}
		return inventories.stream()
				.filter(inventory -> status == null || inventory.getStatus() == status)
				.map(InventoryResponse::from)
				.toList();
	}

	@Override
	@Transactional(readOnly = true)
	public InventoryResponse findById(Long id) {
		return InventoryResponse.from(getInventory(id));
	}

	@Override
	public InventoryResponse create(InventoryRequest request) {
		Inventory inventory = new Inventory();
		apply(inventory, request);
		return InventoryResponse.from(inventoryRepository.save(inventory));
	}

	@Override
	public InventoryResponse update(Long id, InventoryRequest request) {
		Inventory inventory = getInventory(id);
		apply(inventory, request);
		return InventoryResponse.from(inventoryRepository.save(inventory));
	}

	@Override
	public void delete(Long id) {
		inventoryRepository.delete(getInventory(id));
	}

	private void apply(Inventory inventory, InventoryRequest request) {
		StorageLocation location = storageLocationRepository.findById(request.locationId()).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Local de estoque não encontrado"));
		inventory.setLocation(location);
		inventory.setInventoryDate(request.inventoryDate() == null ? Instant.now() : request.inventoryDate());
		inventory.setStatus(request.status() == null ? InventoryStatus.OPEN : request.status());
		inventory.setNotes(request.notes());
		inventory.getItems().clear();
		Set<Long> seen = new HashSet<>();
		for (InventoryItemRequest itemRequest : request.items()) {
			if (!seen.add(itemRequest.productId())) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto duplicado no inventário");
			}
			Product product = productRepository.findById(itemRequest.productId())
					.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto não encontrado"));
			InventoryItem item = new InventoryItem();
			item.setInventory(inventory);
			item.setProduct(product);
			item.setExpectedQuantity(itemRequest.expectedQuantity());
			item.setCountedQuantity(itemRequest.countedQuantity());
			inventory.getItems().add(item);
		}
	}

	private Inventory getInventory(Long id) {
		return inventoryRepository.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inventário não encontrado"));
	}

}
