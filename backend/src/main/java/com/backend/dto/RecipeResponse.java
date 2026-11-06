package com.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import com.backend.entity.Recipe;

public record RecipeResponse(Long id, Long productId, String productName, BigDecimal yieldQuantity,
		String instructions, String notes, boolean active, List<RecipeIngredientResponse> ingredients,
		Instant createdAt, Instant updatedAt) {

	public static RecipeResponse from(Recipe recipe) {
		List<RecipeIngredientResponse> ingredients = recipe.getIngredients().stream()
				.map(RecipeIngredientResponse::from)
				.toList();
		return new RecipeResponse(recipe.getId(), recipe.getProduct().getId(), recipe.getProduct().getName(),
				recipe.getYieldQuantity(), recipe.getInstructions(), recipe.getNotes(), recipe.isActive(), ingredients,
				recipe.getCreatedAt(), recipe.getUpdatedAt());
	}

}
