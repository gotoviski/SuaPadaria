package com.backend.service;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.SaleItemRequest;
import com.backend.dto.SaleItemResponse;
import com.backend.entity.Product;
import com.backend.entity.Sale;
import com.backend.entity.SaleItem;
import com.backend.repository.ProductRepository;
import com.backend.repository.SaleItemRepository;
import com.backend.repository.SaleRepository;

@Service
@Transactional
public class SaleItemServiceImpl implements SaleItemService {

	private final SaleItemRepository itemRepository;

	private final SaleRepository saleRepository;

	private final ProductRepository productRepository;

	public SaleItemServiceImpl(SaleItemRepository itemRepository, SaleRepository saleRepository,
			ProductRepository productRepository) {
		this.itemRepository = itemRepository;
		this.saleRepository = saleRepository;
		this.productRepository = productRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<SaleItemResponse> findAll(Long saleId, Long productId, String search) {
		List<SaleItem> items;
		if (saleId != null) {
			items = itemRepository.findBySaleIdOrderByProductName(saleId);
		}
		else if (productId != null) {
			items = itemRepository.findByProductIdOrderBySaleSaleDateDesc(productId);
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
				.map(SaleItemResponse::from)
				.toList();
	}

	@Override
	@Transactional(readOnly = true)
	public SaleItemResponse findById(Long id) {
		return SaleItemResponse.from(getItem(id));
	}

	@Override
	public SaleItemResponse create(SaleItemRequest request) {
		Sale sale = getSale(request.saleId());
		Product product = getProduct(request.productId());
		if (itemRepository.existsBySaleIdAndProductId(sale.getId(), product.getId())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Produto já está nesta venda");
		}
		SaleItem item = new SaleItem();
		item.setSale(sale);
		item.setProduct(product);
		item.setQuantity(request.quantity());
		item.setUnitPrice(request.unitPrice());
		return SaleItemResponse.from(itemRepository.save(item));
	}

	@Override
	public SaleItemResponse update(Long id, SaleItemRequest request) {
		SaleItem item = getItem(id);
		Sale sale = getSale(request.saleId());
		Product product = getProduct(request.productId());
		boolean samePair = item.getSale().getId().equals(sale.getId())
				&& item.getProduct().getId().equals(product.getId());
		if (!samePair && itemRepository.existsBySaleIdAndProductId(sale.getId(), product.getId())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Produto já está nesta venda");
		}
		item.setSale(sale);
		item.setProduct(product);
		item.setQuantity(request.quantity());
		item.setUnitPrice(request.unitPrice());
		return SaleItemResponse.from(itemRepository.save(item));
	}

	@Override
	public void delete(Long id) {
		itemRepository.delete(getItem(id));
	}

	private SaleItem getItem(Long id) {
		return itemRepository.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item de venda não encontrado"));
	}

	private Sale getSale(Long id) {
		if (id == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Venda é obrigatória");
		}
		return saleRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Venda não encontrada"));
	}

	private Product getProduct(Long id) {
		return productRepository.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto não encontrado"));
	}

}
