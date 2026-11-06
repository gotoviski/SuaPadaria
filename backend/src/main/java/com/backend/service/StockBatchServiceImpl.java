package com.backend.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.StockBatchRequest;
import com.backend.dto.StockBatchResponse;
import com.backend.entity.Product;
import com.backend.entity.StockBatch;
import com.backend.entity.StorageLocation;
import com.backend.repository.ProductRepository;
import com.backend.repository.StockBatchRepository;
import com.backend.repository.StorageLocationRepository;

@Service
@Transactional
public class StockBatchServiceImpl implements StockBatchService {

	private final StockBatchRepository stockBatchRepository;

	private final ProductRepository productRepository;

	private final StorageLocationRepository storageLocationRepository;

	public StockBatchServiceImpl(StockBatchRepository stockBatchRepository, ProductRepository productRepository,
			StorageLocationRepository storageLocationRepository) {
		this.stockBatchRepository = stockBatchRepository;
		this.productRepository = productRepository;
		this.storageLocationRepository = storageLocationRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<StockBatchResponse> findAll(Long productId, Long locationId, String search) {
		List<StockBatch> batches;
		if (productId != null) {
			batches = stockBatchRepository.findByProductIdOrderByExpirationDateAsc(productId);
		}
		else if (locationId != null) {
			batches = stockBatchRepository.findByLocationIdOrderByExpirationDateAsc(locationId);
		}
		else if (search != null && !search.isBlank()) {
			batches = stockBatchRepository
					.findByProductNameContainingIgnoreCaseOrBatchNumberContainingIgnoreCaseOrderByExpirationDateAsc(
							search, search);
		}
		else {
			batches = stockBatchRepository.findAllByOrderByExpirationDateAsc();
		}
		return batches.stream()
				.filter(batch -> productId == null || batch.getProduct().getId().equals(productId))
				.filter(batch -> locationId == null || batch.getLocation().getId().equals(locationId))
				.map(StockBatchResponse::from)
				.toList();
	}

	@Override
	@Transactional(readOnly = true)
	public StockBatchResponse findById(Long id) {
		return StockBatchResponse.from(getBatch(id));
	}

	@Override
	public StockBatchResponse create(StockBatchRequest request) {
		Product product = getProduct(request.productId());
		StorageLocation location = getLocation(request.locationId());
		checkUnique(request, product, null);
		StockBatch batch = new StockBatch();
		batch.setProduct(product);
		batch.setLocation(location);
		apply(batch, request);
		return StockBatchResponse.from(stockBatchRepository.save(batch));
	}

	@Override
	public StockBatchResponse update(Long id, StockBatchRequest request) {
		StockBatch batch = getBatch(id);
		Product product = getProduct(request.productId());
		StorageLocation location = getLocation(request.locationId());
		checkUnique(request, product, batch);
		batch.setProduct(product);
		batch.setLocation(location);
		apply(batch, request);
		return StockBatchResponse.from(stockBatchRepository.save(batch));
	}

	@Override
	public void delete(Long id) {
		stockBatchRepository.delete(getBatch(id));
	}

	private void apply(StockBatch batch, StockBatchRequest request) {
		if (request.manufactureDate() != null && request.expirationDate() != null
				&& request.expirationDate().isBefore(request.manufactureDate())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Data de validade não pode ser anterior à data de fabricação");
		}
		batch.setBatchNumber(request.batchNumber());
		batch.setQuantity(request.quantity());
		batch.setManufactureDate(request.manufactureDate());
		batch.setExpirationDate(request.expirationDate());
		batch.setNotes(request.notes());
	}

	private void checkUnique(StockBatchRequest request, Product product, StockBatch current) {
		boolean sameBatch = current != null && current.getProduct().getId().equals(product.getId())
				&& request.batchNumber().equalsIgnoreCase(current.getBatchNumber());
		if (!sameBatch && stockBatchRepository.existsByProductIdAndBatchNumberIgnoreCase(product.getId(),
				request.batchNumber())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Lote já cadastrado para este produto");
		}
	}

	private StockBatch getBatch(Long id) {
		return stockBatchRepository.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lote não encontrado"));
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
