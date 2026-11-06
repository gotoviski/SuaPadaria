package com.backend.service;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.StockBalanceRequest;
import com.backend.dto.StockBalanceResponse;
import com.backend.entity.Product;
import com.backend.entity.StockBalance;
import com.backend.entity.StorageLocation;
import com.backend.repository.ProductRepository;
import com.backend.repository.StockBalanceRepository;
import com.backend.repository.StorageLocationRepository;

@Service
@Transactional
public class StockBalanceServiceImpl implements StockBalanceService {

	private final StockBalanceRepository stockBalanceRepository;

	private final ProductRepository productRepository;

	private final StorageLocationRepository storageLocationRepository;

	public StockBalanceServiceImpl(StockBalanceRepository stockBalanceRepository, ProductRepository productRepository,
			StorageLocationRepository storageLocationRepository) {
		this.stockBalanceRepository = stockBalanceRepository;
		this.productRepository = productRepository;
		this.storageLocationRepository = storageLocationRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<StockBalanceResponse> findAll(Long productId, Long locationId, String search) {
		List<StockBalance> balances;
		if (productId != null) {
			balances = stockBalanceRepository.findByProductIdOrderByLocationName(productId);
		}
		else if (locationId != null) {
			balances = stockBalanceRepository.findByLocationIdOrderByProductName(locationId);
		}
		else if (search != null && !search.isBlank()) {
			balances = stockBalanceRepository.findByProductNameContainingIgnoreCaseOrderByProductName(search);
		}
		else {
			balances = stockBalanceRepository.findAll(Sort.by("product.name"));
		}
		return balances.stream()
				.filter(balance -> productId == null || balance.getProduct().getId().equals(productId))
				.filter(balance -> locationId == null || balance.getLocation().getId().equals(locationId))
				.map(StockBalanceResponse::from)
				.toList();
	}

	@Override
	@Transactional(readOnly = true)
	public StockBalanceResponse findById(Long id) {
		return StockBalanceResponse.from(getBalance(id));
	}

	@Override
	public StockBalanceResponse create(StockBalanceRequest request) {
		Product product = getProduct(request.productId());
		StorageLocation location = getLocation(request.locationId());
		if (stockBalanceRepository.existsByProductIdAndLocationId(product.getId(), location.getId())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Produto já possui saldo neste local");
		}
		StockBalance balance = new StockBalance();
		balance.setProduct(product);
		balance.setLocation(location);
		balance.setQuantity(request.quantity());
		return StockBalanceResponse.from(stockBalanceRepository.save(balance));
	}

	@Override
	public StockBalanceResponse update(Long id, StockBalanceRequest request) {
		StockBalance balance = getBalance(id);
		Product product = getProduct(request.productId());
		StorageLocation location = getLocation(request.locationId());
		boolean samePair = balance.getProduct().getId().equals(product.getId())
				&& balance.getLocation().getId().equals(location.getId());
		if (!samePair && stockBalanceRepository.existsByProductIdAndLocationId(product.getId(), location.getId())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Produto já possui saldo neste local");
		}
		balance.setProduct(product);
		balance.setLocation(location);
		balance.setQuantity(request.quantity());
		return StockBalanceResponse.from(stockBalanceRepository.save(balance));
	}

	@Override
	public void delete(Long id) {
		stockBalanceRepository.delete(getBalance(id));
	}

	private StockBalance getBalance(Long id) {
		return stockBalanceRepository.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Saldo de estoque não encontrado"));
	}

	private Product getProduct(Long id) {
		return productRepository.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto não encontrado"));
	}

	private StorageLocation getLocation(Long id) {
		return storageLocationRepository.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Local de estoque não encontrado"));
	}

}
