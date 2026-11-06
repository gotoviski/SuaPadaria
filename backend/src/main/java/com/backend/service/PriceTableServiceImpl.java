package com.backend.service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.PriceTableItemRequest;
import com.backend.dto.PriceTableRequest;
import com.backend.dto.PriceTableResponse;
import com.backend.entity.PriceTable;
import com.backend.entity.PriceTableItem;
import com.backend.entity.Product;
import com.backend.repository.PriceTableRepository;
import com.backend.repository.ProductRepository;

@Service
@Transactional
public class PriceTableServiceImpl implements PriceTableService {

	private final PriceTableRepository priceTableRepository;

	private final ProductRepository productRepository;

	public PriceTableServiceImpl(PriceTableRepository priceTableRepository, ProductRepository productRepository) {
		this.priceTableRepository = priceTableRepository;
		this.productRepository = productRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<PriceTableResponse> findAll(String search) {
		List<PriceTable> tables = search == null || search.isBlank()
				? priceTableRepository.findAll(Sort.by("name"))
				: priceTableRepository.findByNameContainingIgnoreCaseOrderByName(search);
		return tables.stream().map(PriceTableResponse::from).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public PriceTableResponse findById(Long id) {
		return PriceTableResponse.from(getTable(id));
	}

	@Override
	public PriceTableResponse create(PriceTableRequest request) {
		if (priceTableRepository.existsByNameIgnoreCase(request.name())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Tabela de preços já cadastrada");
		}
		PriceTable table = new PriceTable();
		table.setActive(request.active() == null || request.active());
		apply(table, request);
		return PriceTableResponse.from(priceTableRepository.save(table));
	}

	@Override
	public PriceTableResponse update(Long id, PriceTableRequest request) {
		PriceTable table = getTable(id);
		if (!request.name().equalsIgnoreCase(table.getName())
				&& priceTableRepository.existsByNameIgnoreCase(request.name())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Tabela de preços já cadastrada");
		}
		apply(table, request);
		table.setActive(request.active() == null || request.active());
		return PriceTableResponse.from(priceTableRepository.save(table));
	}

	@Override
	public void delete(Long id) {
		priceTableRepository.delete(getTable(id));
	}

	private void apply(PriceTable table, PriceTableRequest request) {
		table.setName(request.name());
		table.setDescription(request.description());
		table.getItems().clear();
		if (request.items() == null) {
			return;
		}
		Set<Long> seen = new HashSet<>();
		for (PriceTableItemRequest itemRequest : request.items()) {
			if (!seen.add(itemRequest.productId())) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto duplicado na tabela de preços");
			}
			Product product = productRepository.findById(itemRequest.productId())
					.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto não encontrado"));
			PriceTableItem item = new PriceTableItem();
			item.setPriceTable(table);
			item.setProduct(product);
			item.setPrice(itemRequest.price());
			table.getItems().add(item);
		}
	}

	private PriceTable getTable(Long id) {
		return priceTableRepository.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tabela de preços não encontrada"));
	}

}
