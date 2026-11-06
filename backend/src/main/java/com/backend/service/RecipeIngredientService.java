package com.backend.service;

import java.util.List;

import com.backend.dto.RecipeIngredientRequest;
import com.backend.dto.RecipeIngredientResponse;

public interface RecipeIngredientService {

	List<RecipeIngredientResponse> findAll(Long recipeId, Long productId, String search);

	RecipeIngredientResponse findById(Long id);

	RecipeIngredientResponse create(RecipeIngredientRequest request);

	RecipeIngredientResponse update(Long id, RecipeIngredientRequest request);

	void delete(Long id);

}
