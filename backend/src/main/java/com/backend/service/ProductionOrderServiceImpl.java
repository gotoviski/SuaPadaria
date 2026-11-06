package com.backend.service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.ProductionConsumptionRequest;
import com.backend.dto.ProductionOrderRequest;
import com.backend.dto.ProductionOrderResponse;
import com.backend.dto.ProductionResultRequest;
import com.backend.entity.Product;
import com.backend.entity.ProductionConsumption;
import com.backend.entity.ProductionOrder;
import com.backend.entity.ProductionResult;
import com.backend.entity.ProductionStatus;
import com.backend.entity.Recipe;
import com.backend.repository.ProductRepository;
import com.backend.repository.ProductionOrderRepository;
import com.backend.repository.RecipeRepository;

@Service
@Transactional
public class ProductionOrderServiceImpl implements ProductionOrderService {

	private final ProductionOrderRepository orderRepository;

	private final RecipeRepository recipeRepository;

	private final ProductRepository productRepository;

	public ProductionOrderServiceImpl(ProductionOrderRepository orderRepository, RecipeRepository recipeRepository,
			ProductRepository productRepository) {
		this.orderRepository = orderRepository;
		this.recipeRepository = recipeRepository;
		this.productRepository = productRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<ProductionOrderResponse> findAll(ProductionStatus status, String search) {
		List<ProductionOrder> orders;
		if (status != null) {
			orders = orderRepository.findByStatusOrderByCreatedAtDesc(status);
		}
		else if (search != null && !search.isBlank()) {
			orders = orderRepository.findByRecipeProductNameContainingIgnoreCaseOrderByCreatedAtDesc(search);
		}
		else {
			orders = orderRepository.findAllByOrderByCreatedAtDesc();
		}
		return orders.stream()
				.filter(order -> search == null || search.isBlank()
						|| order.getRecipe().getProduct().getName().toLowerCase().contains(search.toLowerCase()))
				.map(ProductionOrderResponse::from)
				.toList();
	}

	@Override
	@Transactional(readOnly = true)
	public ProductionOrderResponse findById(Long id) {
		return ProductionOrderResponse.from(getOrder(id));
	}

	@Override
	public ProductionOrderResponse create(ProductionOrderRequest request) {
		ProductionOrder order = new ProductionOrder();
		apply(order, request);
		return ProductionOrderResponse.from(orderRepository.save(order));
	}

	@Override
	public ProductionOrderResponse update(Long id, ProductionOrderRequest request) {
		ProductionOrder order = getOrder(id);
		apply(order, request);
		return ProductionOrderResponse.from(orderRepository.save(order));
	}

	@Override
	public void delete(Long id) {
		orderRepository.delete(getOrder(id));
	}

	private void apply(ProductionOrder order, ProductionOrderRequest request) {
		Recipe recipe = recipeRepository.findById(request.recipeId()).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Receita não encontrada"));
		order.setRecipe(recipe);
		order.setPlannedQuantity(request.plannedQuantity());
		if (request.status() != null) {
			order.setStatus(request.status());
		}
		order.setScheduledDate(request.scheduledDate());
		order.setStartedAt(request.startedAt());
		order.setFinishedAt(request.finishedAt());
		order.setNotes(request.notes());

		order.getConsumptions().clear();
		Set<Long> seenConsumption = new HashSet<>();
		if (request.consumptions() != null) {
			for (ProductionConsumptionRequest consumptionRequest : request.consumptions()) {
				if (!seenConsumption.add(consumptionRequest.productId())) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto duplicado no consumo");
				}
				ProductionConsumption consumption = new ProductionConsumption();
				consumption.setProductionOrder(order);
				consumption.setProduct(getProduct(consumptionRequest.productId()));
				consumption.setQuantity(consumptionRequest.quantity());
				order.getConsumptions().add(consumption);
			}
		}

		order.getResults().clear();
		Set<Long> seenResult = new HashSet<>();
		if (request.results() != null) {
			for (ProductionResultRequest resultRequest : request.results()) {
				if (!seenResult.add(resultRequest.productId())) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto duplicado no resultado");
				}
				ProductionResult result = new ProductionResult();
				result.setProductionOrder(order);
				result.setProduct(getProduct(resultRequest.productId()));
				result.setQuantity(resultRequest.quantity());
				order.getResults().add(result);
			}
		}
	}

	private Product getProduct(Long id) {
		return productRepository.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto não encontrado"));
	}

	private ProductionOrder getOrder(Long id) {
		return orderRepository.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ordem de produção não encontrada"));
	}

}
