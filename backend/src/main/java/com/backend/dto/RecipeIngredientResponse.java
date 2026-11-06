package com.backend.dto;

import java.math.BigDecimal;

import com.backend.entity.RecipeIngredient;

public record RecipeIngredientResponse(Long id, Long recipeId, String recipeProductName, Long productId,
		String productName, BigDecimal quantity) {

	public static RecipeIngredientResponse from(RecipeIngredient ingredient) {
		return new RecipeIngredientResponse(ingredient.getId(), ingredient.getRecipe().getId(),
				ingredient.getRecipe().getProduct().getName(), ingredient.getProduct().getId(),
				ingredient.getProduct().getName(), ingredient.getQuantity());
	}

}
