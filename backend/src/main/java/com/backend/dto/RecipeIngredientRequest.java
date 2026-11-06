package com.backend.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record RecipeIngredientRequest(

	Long recipeId,

	@NotNull(message = "Produto é obrigatório")
	Long productId,

	@NotNull(message = "Quantidade é obrigatória")
	@DecimalMin(value = "0.001", message = "Quantidade deve ser maior que zero")
	BigDecimal quantity

) {}
