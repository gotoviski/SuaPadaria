package com.backend.service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.RecipeIngredientRequest;
import com.backend.dto.RecipeRequest;
import com.backend.dto.RecipeResponse;
import com.backend.entity.Product;
import com.backend.entity.Recipe;
import com.backend.entity.RecipeIngredient;
import com.backend.repository.ProductRepository;
import com.backend.repository.RecipeRepository;

@Service
@Transactional
public class RecipeServiceImpl implements RecipeService {

	private final RecipeRepository recipeRepository;

	private final ProductRepository productRepository;

	public RecipeServiceImpl(RecipeRepository recipeRepository, ProductRepository productRepository) {
		this.recipeRepository = recipeRepository;
		this.productRepository = productRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<RecipeResponse> findAll(String search) {
		List<Recipe> recipes = search == null || search.isBlank()
				? recipeRepository.findAllByOrderByProductName()
				: recipeRepository.findByProductNameContainingIgnoreCaseOrderByProductName(search);
		return recipes.stream().map(RecipeResponse::from).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public RecipeResponse findById(Long id) {
		return RecipeResponse.from(getRecipe(id));
	}

	@Override
	public RecipeResponse create(RecipeRequest request) {
		Recipe recipe = new Recipe();
		apply(recipe, request);
		return RecipeResponse.from(recipeRepository.save(recipe));
	}

	@Override
	public RecipeResponse update(Long id, RecipeRequest request) {
		Recipe recipe = getRecipe(id);
		apply(recipe, request);
		return RecipeResponse.from(recipeRepository.save(recipe));
	}

	@Override
	public void delete(Long id) {
		recipeRepository.delete(getRecipe(id));
	}

	private void apply(Recipe recipe, RecipeRequest request) {
		Product product = productRepository.findById(request.productId()).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto não encontrado"));
		recipe.setProduct(product);
		recipe.setYieldQuantity(request.yieldQuantity());
		recipe.setInstructions(request.instructions());
		recipe.setNotes(request.notes());
		if (request.active() != null) {
			recipe.setActive(request.active());
		}
		recipe.getIngredients().clear();
		Set<Long> seen = new HashSet<>();
		for (RecipeIngredientRequest ingredientRequest : request.ingredients()) {
			if (!seen.add(ingredientRequest.productId())) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ingrediente duplicado na receita");
			}
			if (ingredientRequest.productId().equals(product.getId())) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
						"Produto produzido não pode ser ingrediente da própria receita");
			}
			Product ingredientProduct = productRepository.findById(ingredientRequest.productId())
					.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto não encontrado"));
			RecipeIngredient ingredient = new RecipeIngredient();
			ingredient.setRecipe(recipe);
			ingredient.setProduct(ingredientProduct);
			ingredient.setQuantity(ingredientRequest.quantity());
			recipe.getIngredients().add(ingredient);
		}
	}

	private Recipe getRecipe(Long id) {
		return recipeRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Receita não encontrada"));
	}

}
