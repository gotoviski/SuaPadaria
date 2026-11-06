package com.backend.service;

import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.StockMovementRequest;
import com.backend.dto.StockMovementResponse;
import com.backend.entity.MovementType;
import com.backend.entity.Product;
import com.backend.entity.StockBatch;
import com.backend.entity.StockMovement;
import com.backend.entity.StorageLocation;
import com.backend.repository.ProductRepository;
import com.backend.repository.StockBatchRepository;
import com.backend.repository.StockMovementRepository;
import com.backend.repository.StorageLocationRepository;

@Service
@Transactional
public class StockMovementServiceImpl implements StockMovementService {

	private final StockMovementRepository stockMovementRepository;

	private final ProductRepository productRepository;

	private final StorageLocationRepository storageLocationRepository;

	private final StockBatchRepository stockBatchRepository;

	public StockMovementServiceImpl(StockMovementRepository stockMovementRepository,
			ProductRepository productRepository, StorageLocationRepository storageLocationRepository,
			StockBatchRepository stockBatchRepository) {
		this.stockMovementRepository = stockMovementRepository;
		this.productRepository = productRepository;
		this.storageLocationRepository = storageLocationRepository;
		this.stockBatchRepository = stockBatchRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<StockMovementResponse> findAll(Long productId, Long locationId, MovementType type, String search) {
		List<StockMovement> movements;
		if (productId != null) {
			movements = stockMovementRepository.findByProductIdOrderByMovementDateDesc(productId);
		}
		else if (locationId != null) {
			movements = stockMovementRepository.findByLocationIdOrderByMovementDateDesc(locationId);
		}
		else if (search != null && !search.isBlank()) {
			movements = stockMovementRepository.findByProductNameContainingIgnoreCaseOrderByMovementDateDesc(search);
		}
		else {
			movements = stockMovementRepository.findAllByOrderByMovementDateDesc();
		}
		return movements.stream()
				.filter(movement -> locationId == null || movement.getLocation().getId().equals(locationId))
				.filter(movement -> type == null || movement.getType() == type)
				.filter(movement -> search == null || search.isBlank()
						|| movement.getProduct().getName().toLowerCase().contains(search.toLowerCase()))
				.map(StockMovementResponse::from)
				.toList();
	}

	@Override
	@Transactional(readOnly = true)
	public StockMovementResponse findById(Long id) {
		return StockMovementResponse.from(getMovement(id));
	}

	@Override
	public StockMovementResponse create(StockMovementRequest request) {
		StockMovement movement = new StockMovement();
		apply(movement, request);
		return StockMovementResponse.from(stockMovementRepository.save(movement));
	}

	@Override
	public StockMovementResponse update(Long id, StockMovementRequest request) {
		StockMovement movement = getMovement(id);
		apply(movement, request);
		return StockMovementResponse.from(stockMovementRepository.save(movement));
	}

	@Override
	public void delete(Long id) {
		stockMovementRepository.delete(getMovement(id));
	}

	private void apply(StockMovement movement, StockMovementRequest request) {
		Product product = productRepository.findById(request.productId()).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto não encontrado"));
		StorageLocation location = storageLocationRepository.findById(request.locationId()).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Local de estoque não encontrado"));
		movement.setProduct(product);
		movement.setLocation(location);
		movement.setBatch(getBatch(request.batchId(), product));
		movement.setType(request.type());
		movement.setQuantity(request.quantity());
		movement.setReason(request.reason());
		movement.setReference(request.reference());
		movement.setMovementDate(request.movementDate() == null ? Instant.now() : request.movementDate());
		movement.setNotes(request.notes());
	}

	private StockBatch getBatch(Long batchId, Product product) {
		if (batchId == null) {
			return null;
		}
		StockBatch batch = stockBatchRepository.findById(batchId).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lote não encontrado"));
		if (!batch.getProduct().getId().equals(product.getId())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lote não pertence ao produto informado");
		}
		return batch;
	}

	private StockMovement getMovement(Long id) {
		return stockMovementRepository.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movimentação de estoque não encontrada"));
	}

}
