package com.backend.service;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.ProductionResultRequest;
import com.backend.dto.ProductionResultResponse;
import com.backend.entity.Product;
import com.backend.entity.ProductionOrder;
import com.backend.entity.ProductionResult;
import com.backend.repository.ProductRepository;
import com.backend.repository.ProductionOrderRepository;
import com.backend.repository.ProductionResultRepository;

@Service
@Transactional
public class ProductionResultServiceImpl implements ProductionResultService {

	private final ProductionResultRepository resultRepository;

	private final ProductionOrderRepository orderRepository;

	private final ProductRepository productRepository;

	public ProductionResultServiceImpl(ProductionResultRepository resultRepository,
			ProductionOrderRepository orderRepository, ProductRepository productRepository) {
		this.resultRepository = resultRepository;
		this.orderRepository = orderRepository;
		this.productRepository = productRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<ProductionResultResponse> findAll(Long orderId, Long productId, String search) {
		List<ProductionResult> results;
		if (orderId != null) {
			results = resultRepository.findByProductionOrderIdOrderByProductName(orderId);
		}
		else if (productId != null) {
			results = resultRepository.findByProductIdOrderByIdDesc(productId);
		}
		else if (search != null && !search.isBlank()) {
			results = resultRepository.findByProductNameContainingIgnoreCaseOrderByProductName(search);
		}
		else {
			results = resultRepository.findAll(Sort.by("product.name"));
		}
		return results.stream().map(ProductionResultResponse::from).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public ProductionResultResponse findById(Long id) {
		return ProductionResultResponse.from(getResult(id));
	}

	@Override
	public ProductionResultResponse create(ProductionResultRequest request) {
		ProductionOrder order = getOrder(request.orderId());
		Product product = getProduct(request.productId());
		if (resultRepository.existsByProductionOrderIdAndProductId(order.getId(), product.getId())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Produto já está no resultado desta ordem");
		}
		ProductionResult result = new ProductionResult();
		result.setProductionOrder(order);
		result.setProduct(product);
		result.setQuantity(request.quantity());
		return ProductionResultResponse.from(resultRepository.save(result));
	}

	@Override
	public ProductionResultResponse update(Long id, ProductionResultRequest request) {
		ProductionResult result = getResult(id);
		ProductionOrder order = getOrder(request.orderId());
		Product product = getProduct(request.productId());
		boolean samePair = result.getProductionOrder().getId().equals(order.getId())
				&& result.getProduct().getId().equals(product.getId());
		if (!samePair && resultRepository.existsByProductionOrderIdAndProductId(order.getId(), product.getId())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Produto já está no resultado desta ordem");
		}
		result.setProductionOrder(order);
		result.setProduct(product);
		result.setQuantity(request.quantity());
		return ProductionResultResponse.from(resultRepository.save(result));
	}

	@Override
	public void delete(Long id) {
		resultRepository.delete(getResult(id));
	}

	private ProductionResult getResult(Long id) {
		return resultRepository.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resultado de produção não encontrado"));
	}

	private ProductionOrder getOrder(Long id) {
		if (id == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ordem de produção é obrigatória");
		}
		return orderRepository.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ordem de produção não encontrada"));
	}

	private Product getProduct(Long id) {
		return productRepository.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto não encontrado"));
	}

}
