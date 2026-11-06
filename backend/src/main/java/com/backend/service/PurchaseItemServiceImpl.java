package com.backend.service;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.PurchaseItemRequest;
import com.backend.dto.PurchaseItemResponse;
import com.backend.entity.Product;
import com.backend.entity.Purchase;
import com.backend.entity.PurchaseItem;
import com.backend.repository.ProductRepository;
import com.backend.repository.PurchaseItemRepository;
import com.backend.repository.PurchaseRepository;

@Service
@Transactional
public class PurchaseItemServiceImpl implements PurchaseItemService {

	private final PurchaseItemRepository itemRepository;

	private final PurchaseRepository purchaseRepository;

	private final ProductRepository productRepository;

	public PurchaseItemServiceImpl(PurchaseItemRepository itemRepository, PurchaseRepository purchaseRepository,
			ProductRepository productRepository) {
		this.itemRepository = itemRepository;
		this.purchaseRepository = purchaseRepository;
		this.productRepository = productRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<PurchaseItemResponse> findAll(Long purchaseId, Long productId, String search) {
		List<PurchaseItem> items;
		if (purchaseId != null) {
			items = itemRepository.findByPurchaseIdOrderByProductName(purchaseId);
		}
		else if (productId != null) {
			items = itemRepository.findByProductIdOrderByPurchasePurchaseDateDesc(productId);
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
				.map(PurchaseItemResponse::from)
				.toList();
	}

	@Override
	@Transactional(readOnly = true)
	public PurchaseItemResponse findById(Long id) {
		return PurchaseItemResponse.from(getItem(id));
	}

	@Override
	public PurchaseItemResponse create(PurchaseItemRequest request) {
		Purchase purchase = getPurchase(request.purchaseId());
		Product product = getProduct(request.productId());
		if (itemRepository.existsByPurchaseIdAndProductId(purchase.getId(), product.getId())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Produto já está nesta compra");
		}
		PurchaseItem item = new PurchaseItem();
		item.setPurchase(purchase);
		item.setProduct(product);
		item.setQuantity(request.quantity());
		item.setUnitPrice(request.unitPrice());
		return PurchaseItemResponse.from(itemRepository.save(item));
	}

	@Override
	public PurchaseItemResponse update(Long id, PurchaseItemRequest request) {
		PurchaseItem item = getItem(id);
		Purchase purchase = getPurchase(request.purchaseId());
		Product product = getProduct(request.productId());
		boolean samePair = item.getPurchase().getId().equals(purchase.getId())
				&& item.getProduct().getId().equals(product.getId());
		if (!samePair && itemRepository.existsByPurchaseIdAndProductId(purchase.getId(), product.getId())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Produto já está nesta compra");
		}
		item.setPurchase(purchase);
		item.setProduct(product);
		item.setQuantity(request.quantity());
		item.setUnitPrice(request.unitPrice());
		return PurchaseItemResponse.from(itemRepository.save(item));
	}

	@Override
	public void delete(Long id) {
		itemRepository.delete(getItem(id));
	}

	private PurchaseItem getItem(Long id) {
		return itemRepository.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item de compra não encontrado"));
	}

	private Purchase getPurchase(Long id) {
		if (id == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Compra é obrigatória");
		}
		return purchaseRepository.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Compra não encontrada"));
	}

	private Product getProduct(Long id) {
		return productRepository.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto não encontrado"));
	}

}
