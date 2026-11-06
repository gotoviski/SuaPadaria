package com.backend.service;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.InventoryItemRequest;
import com.backend.dto.InventoryItemResponse;
import com.backend.entity.Inventory;
import com.backend.entity.InventoryItem;
import com.backend.entity.Product;
import com.backend.repository.InventoryItemRepository;
import com.backend.repository.InventoryRepository;
import com.backend.repository.ProductRepository;

@Service
@Transactional
public class InventoryItemServiceImpl implements InventoryItemService {

	private final InventoryItemRepository itemRepository;

	private final InventoryRepository inventoryRepository;

	private final ProductRepository productRepository;

	public InventoryItemServiceImpl(InventoryItemRepository itemRepository, InventoryRepository inventoryRepository,
			ProductRepository productRepository) {
		this.itemRepository = itemRepository;
		this.inventoryRepository = inventoryRepository;
		this.productRepository = productRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<InventoryItemResponse> findAll(Long inventoryId, Long productId, String search) {
		List<InventoryItem> items;
		if (inventoryId != null) {
			items = itemRepository.findByInventoryIdOrderByProductName(inventoryId);
		}
		else if (productId != null) {
			items = itemRepository.findByProductIdOrderByInventoryInventoryDateDesc(productId);
		}
		else if (search != null && !search.isBlank()) {
			items = itemRepository.findByProductNameContainingIgnoreCaseOrderByProductName(search);
		}
		else {
			items = itemRepository.findAll(Sort.by("product.name"));
		}
		return items.stream()
				.filter(item -> productId == null || item.getProduct().getId().equals(productId))
				.filter(item -> search == null || search.isBlank()
						|| item.getProduct().getName().toLowerCase().contains(search.toLowerCase()))
				.map(InventoryItemResponse::from)
				.toList();
	}

	@Override
	@Transactional(readOnly = true)
	public InventoryItemResponse findById(Long id) {
		return InventoryItemResponse.from(getItem(id));
	}

	@Override
	public InventoryItemResponse create(InventoryItemRequest request) {
		Inventory inventory = getInventory(request.inventoryId());
		Product product = getProduct(request.productId());
		if (itemRepository.existsByInventoryIdAndProductId(inventory.getId(), product.getId())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Produto já está neste inventário");
		}
		InventoryItem item = new InventoryItem();
		item.setInventory(inventory);
		item.setProduct(product);
		item.setExpectedQuantity(request.expectedQuantity());
		item.setCountedQuantity(request.countedQuantity());
		return InventoryItemResponse.from(itemRepository.save(item));
	}

	@Override
	public InventoryItemResponse update(Long id, InventoryItemRequest request) {
		InventoryItem item = getItem(id);
		Inventory inventory = getInventory(request.inventoryId());
		Product product = getProduct(request.productId());
		boolean samePair = item.getInventory().getId().equals(inventory.getId())
				&& item.getProduct().getId().equals(product.getId());
		if (!samePair && itemRepository.existsByInventoryIdAndProductId(inventory.getId(), product.getId())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Produto já está neste inventário");
		}
		item.setInventory(inventory);
		item.setProduct(product);
		item.setExpectedQuantity(request.expectedQuantity());
		item.setCountedQuantity(request.countedQuantity());
		return InventoryItemResponse.from(itemRepository.save(item));
	}

	@Override
	public void delete(Long id) {
		itemRepository.delete(getItem(id));
	}

	private InventoryItem getItem(Long id) {
		return itemRepository.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item de inventário não encontrado"));
	}

	private Inventory getInventory(Long id) {
		if (id == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Inventário é obrigatório");
		}
		return inventoryRepository.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Inventário não encontrado"));
	}

	private Product getProduct(Long id) {
		return productRepository.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto não encontrado"));
	}

}
