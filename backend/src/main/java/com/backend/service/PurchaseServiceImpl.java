package com.backend.service;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.PurchaseItemRequest;
import com.backend.dto.PurchaseRequest;
import com.backend.dto.PurchaseResponse;
import com.backend.entity.Product;
import com.backend.entity.Purchase;
import com.backend.entity.PurchaseItem;
import com.backend.entity.Supplier;
import com.backend.repository.ProductRepository;
import com.backend.repository.PurchaseRepository;
import com.backend.repository.SupplierRepository;

@Service
@Transactional
public class PurchaseServiceImpl implements PurchaseService {

	private final PurchaseRepository purchaseRepository;

	private final SupplierRepository supplierRepository;

	private final ProductRepository productRepository;

	public PurchaseServiceImpl(PurchaseRepository purchaseRepository, SupplierRepository supplierRepository,
			ProductRepository productRepository) {
		this.purchaseRepository = purchaseRepository;
		this.supplierRepository = supplierRepository;
		this.productRepository = productRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<PurchaseResponse> findAll(String search) {
		List<Purchase> purchases = search == null || search.isBlank()
				? purchaseRepository.findAllByOrderByPurchaseDateDesc()
				: purchaseRepository.findBySupplierNameContainingIgnoreCaseOrderByPurchaseDateDesc(search);
		return purchases.stream().map(PurchaseResponse::from).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public PurchaseResponse findById(Long id) {
		return PurchaseResponse.from(getPurchase(id));
	}

	@Override
	public PurchaseResponse create(PurchaseRequest request) {
		Purchase purchase = new Purchase();
		apply(purchase, request);
		return PurchaseResponse.from(purchaseRepository.save(purchase));
	}

	@Override
	public PurchaseResponse update(Long id, PurchaseRequest request) {
		Purchase purchase = getPurchase(id);
		apply(purchase, request);
		return PurchaseResponse.from(purchaseRepository.save(purchase));
	}

	@Override
	public void delete(Long id) {
		purchaseRepository.delete(getPurchase(id));
	}

	private void apply(Purchase purchase, PurchaseRequest request) {
		Supplier supplier = supplierRepository.findById(request.supplierId()).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fornecedor não encontrado"));
		purchase.setSupplier(supplier);
		purchase.setPurchaseDate(request.purchaseDate() == null ? Instant.now() : request.purchaseDate());
		purchase.setNotes(request.notes());
		purchase.getItems().clear();
		Set<Long> seen = new HashSet<>();
		for (PurchaseItemRequest itemRequest : request.items()) {
			if (!seen.add(itemRequest.productId())) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto duplicado na compra");
			}
			Product product = productRepository.findById(itemRequest.productId())
					.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto não encontrado"));
			PurchaseItem item = new PurchaseItem();
			item.setPurchase(purchase);
			item.setProduct(product);
			item.setQuantity(itemRequest.quantity());
			item.setUnitPrice(itemRequest.unitPrice());
			purchase.getItems().add(item);
		}
	}

	private Purchase getPurchase(Long id) {
		return purchaseRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Compra não encontrada"));
	}

}
