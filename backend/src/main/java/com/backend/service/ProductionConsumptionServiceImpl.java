package com.backend.service;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.ProductionConsumptionRequest;
import com.backend.dto.ProductionConsumptionResponse;
import com.backend.entity.Product;
import com.backend.entity.ProductionConsumption;
import com.backend.entity.ProductionOrder;
import com.backend.repository.ProductRepository;
import com.backend.repository.ProductionConsumptionRepository;
import com.backend.repository.ProductionOrderRepository;

@Service
@Transactional
public class ProductionConsumptionServiceImpl implements ProductionConsumptionService {

	private final ProductionConsumptionRepository consumptionRepository;

	private final ProductionOrderRepository orderRepository;

	private final ProductRepository productRepository;

	public ProductionConsumptionServiceImpl(ProductionConsumptionRepository consumptionRepository,
			ProductionOrderRepository orderRepository, ProductRepository productRepository) {
		this.consumptionRepository = consumptionRepository;
		this.orderRepository = orderRepository;
		this.productRepository = productRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<ProductionConsumptionResponse> findAll(Long orderId, Long productId, String search) {
		List<ProductionConsumption> consumptions;
		if (orderId != null) {
			consumptions = consumptionRepository.findByProductionOrderIdOrderByProductName(orderId);
		}
		else if (productId != null) {
			consumptions = consumptionRepository.findByProductIdOrderByIdDesc(productId);
		}
		else if (search != null && !search.isBlank()) {
			consumptions = consumptionRepository.findByProductNameContainingIgnoreCaseOrderByProductName(search);
		}
		else {
			consumptions = consumptionRepository.findAll(Sort.by("product.name"));
		}
		return consumptions.stream().map(ProductionConsumptionResponse::from).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public ProductionConsumptionResponse findById(Long id) {
		return ProductionConsumptionResponse.from(getConsumption(id));
	}

	@Override
	public ProductionConsumptionResponse create(ProductionConsumptionRequest request) {
		ProductionOrder order = getOrder(request.orderId());
		Product product = getProduct(request.productId());
		if (consumptionRepository.existsByProductionOrderIdAndProductId(order.getId(), product.getId())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Produto já está no consumo desta ordem");
		}
		ProductionConsumption consumption = new ProductionConsumption();
		consumption.setProductionOrder(order);
		consumption.setProduct(product);
		consumption.setQuantity(request.quantity());
		return ProductionConsumptionResponse.from(consumptionRepository.save(consumption));
	}

	@Override
	public ProductionConsumptionResponse update(Long id, ProductionConsumptionRequest request) {
		ProductionConsumption consumption = getConsumption(id);
		ProductionOrder order = getOrder(request.orderId());
		Product product = getProduct(request.productId());
		boolean samePair = consumption.getProductionOrder().getId().equals(order.getId())
				&& consumption.getProduct().getId().equals(product.getId());
		if (!samePair
				&& consumptionRepository.existsByProductionOrderIdAndProductId(order.getId(), product.getId())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Produto já está no consumo desta ordem");
		}
		consumption.setProductionOrder(order);
		consumption.setProduct(product);
		consumption.setQuantity(request.quantity());
		return ProductionConsumptionResponse.from(consumptionRepository.save(consumption));
	}

	@Override
	public void delete(Long id) {
		consumptionRepository.delete(getConsumption(id));
	}

	private ProductionConsumption getConsumption(Long id) {
		return consumptionRepository.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Consumo de produção não encontrado"));
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
