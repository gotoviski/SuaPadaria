package com.backend.service;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.ProductPriceRequest;
import com.backend.dto.ProductPriceResponse;
import com.backend.entity.PriceTable;
import com.backend.entity.PriceTableItem;
import com.backend.entity.Product;
import com.backend.repository.PriceTableItemRepository;
import com.backend.repository.PriceTableRepository;
import com.backend.repository.ProductRepository;

@Service
@Transactional
public class ProductPriceServiceImpl implements ProductPriceService {

	private final PriceTableItemRepository itemRepository;

	private final PriceTableRepository priceTableRepository;

	private final ProductRepository productRepository;

	public ProductPriceServiceImpl(PriceTableItemRepository itemRepository,
			PriceTableRepository priceTableRepository, ProductRepository productRepository) {
		this.itemRepository = itemRepository;
		this.priceTableRepository = priceTableRepository;
		this.productRepository = productRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<ProductPriceResponse> findAll(Long priceTableId, Long productId, String search) {
		List<PriceTableItem> items;
		if (priceTableId != null) {
			items = itemRepository.findByPriceTableIdOrderByProductName(priceTableId);
		}
		else if (productId != null) {
			items = itemRepository.findByProductIdOrderByPriceTableName(productId);
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
				.map(ProductPriceResponse::from)
				.toList();
	}

	@Override
	@Transactional(readOnly = true)
	public ProductPriceResponse findById(Long id) {
		return ProductPriceResponse.from(getItem(id));
	}

	@Override
	public ProductPriceResponse create(ProductPriceRequest request) {
		PriceTable table = getTable(request.priceTableId());
		Product product = getProduct(request.productId());
		if (itemRepository.existsByPriceTableIdAndProductId(table.getId(), product.getId())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Produto já possui preço nesta tabela");
		}
		PriceTableItem item = new PriceTableItem();
		item.setPriceTable(table);
		item.setProduct(product);
		item.setPrice(request.price());
		return ProductPriceResponse.from(itemRepository.save(item));
	}

	@Override
	public ProductPriceResponse update(Long id, ProductPriceRequest request) {
		PriceTableItem item = getItem(id);
		PriceTable table = getTable(request.priceTableId());
		Product product = getProduct(request.productId());
		boolean samePair = item.getPriceTable().getId().equals(table.getId())
				&& item.getProduct().getId().equals(product.getId());
		if (!samePair && itemRepository.existsByPriceTableIdAndProductId(table.getId(), product.getId())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Produto já possui preço nesta tabela");
		}
		item.setPriceTable(table);
		item.setProduct(product);
		item.setPrice(request.price());
		return ProductPriceResponse.from(itemRepository.save(item));
	}

	@Override
	public void delete(Long id) {
		itemRepository.delete(getItem(id));
	}

	private PriceTableItem getItem(Long id) {
		return itemRepository.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Preço de produto não encontrado"));
	}

	private PriceTable getTable(Long id) {
		return priceTableRepository.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tabela de preços não encontrada"));
	}

	private Product getProduct(Long id) {
		return productRepository.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto não encontrado"));
	}

}
