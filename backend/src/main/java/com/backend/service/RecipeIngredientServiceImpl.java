package com.backend.service;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.RecipeIngredientRequest;
import com.backend.dto.RecipeIngredientResponse;
import com.backend.entity.Product;
import com.backend.entity.Recipe;
import com.backend.entity.RecipeIngredient;
import com.backend.repository.ProductRepository;
import com.backend.repository.RecipeIngredientRepository;
import com.backend.repository.RecipeRepository;

@Service
@Transactional
public class RecipeIngredientServiceImpl implements RecipeIngredientService {

	private final RecipeIngredientRepository ingredientRepository;

	private final RecipeRepository recipeRepository;

	private final ProductRepository productRepository;

	public RecipeIngredientServiceImpl(RecipeIngredientRepository ingredientRepository,
			RecipeRepository recipeRepository, ProductRepository productRepository) {
		this.ingredientRepository = ingredientRepository;
		this.recipeRepository = recipeRepository;
		this.productRepository = productRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<RecipeIngredientResponse> findAll(Long recipeId, Long productId, String search) {
		List<RecipeIngredient> ingredients;
		if (recipeId != null) {
			ingredients = ingredientRepository.findByRecipeIdOrderByProductName(recipeId);
		}
		else if (productId != null) {
			ingredients = ingredientRepository.findByProductIdOrderByRecipeProductName(productId);
		}
		else if (search != null && !search.isBlank()) {
			ingredients = ingredientRepository.findByProductNameContainingIgnoreCaseOrderByProductName(search);
		}
		else {
			ingredients = ingredientRepository.findAll(Sort.by("product.name"));
		}
		return ingredients.stream().map(RecipeIngredientResponse::from).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public RecipeIngredientResponse findById(Long id) {
		return RecipeIngredientResponse.from(getIngredient(id));
	}

	@Override
	public RecipeIngredientResponse create(RecipeIngredientRequest request) {
		Recipe recipe = getRecipe(request.recipeId());
		Product product = getProduct(request.productId());
		if (ingredientRepository.existsByRecipeIdAndProductId(recipe.getId(), product.getId())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Ingrediente já está nesta receita");
		}
		if (recipe.getProduct().getId().equals(product.getId())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Produto produzido não pode ser ingrediente da própria receita");
		}
		RecipeIngredient ingredient = new RecipeIngredient();
		ingredient.setRecipe(recipe);
		ingredient.setProduct(product);
		ingredient.setQuantity(request.quantity());
		return RecipeIngredientResponse.from(ingredientRepository.save(ingredient));
	}

	@Override
	public RecipeIngredientResponse update(Long id, RecipeIngredientRequest request) {
		RecipeIngredient ingredient = getIngredient(id);
		Recipe recipe = getRecipe(request.recipeId());
		Product product = getProduct(request.productId());
		boolean samePair = ingredient.getRecipe().getId().equals(recipe.getId())
				&& ingredient.getProduct().getId().equals(product.getId());
		if (!samePair && ingredientRepository.existsByRecipeIdAndProductId(recipe.getId(), product.getId())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Ingrediente já está nesta receita");
		}
		if (recipe.getProduct().getId().equals(product.getId())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Produto produzido não pode ser ingrediente da própria receita");
		}
		ingredient.setRecipe(recipe);
		ingredient.setProduct(product);
		ingredient.setQuantity(request.quantity());
		return RecipeIngredientResponse.from(ingredientRepository.save(ingredient));
	}

	@Override
	public void delete(Long id) {
		ingredientRepository.delete(getIngredient(id));
	}

	private RecipeIngredient getIngredient(Long id) {
		return ingredientRepository.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ingrediente de receita não encontrado"));
	}

	private Recipe getRecipe(Long id) {
		if (id == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Receita é obrigatória");
		}
		return recipeRepository.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Receita não encontrada"));
	}

	private Product getProduct(Long id) {
		return productRepository.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto não encontrado"));
	}

}
