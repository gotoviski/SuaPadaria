package com.backend.dto;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RecipeRequest(

	@NotNull(message = "Produto é obrigatório")
	Long productId,

	@NotNull(message = "Rendimento é obrigatório")
	@DecimalMin(value = "0.001", message = "Rendimento deve ser maior que zero")
	BigDecimal yieldQuantity,

	@Size(max = 1000, message = "Modo de preparo deve ter no máximo 1000 caracteres")
	String instructions,

	@Size(max = 1000, message = "Observações devem ter no máximo 1000 caracteres")
	String notes,

	Boolean active,

	@NotEmpty(message = "Receita deve ter pelo menos um ingrediente")
	List<@Valid RecipeIngredientRequest> ingredients

) {}
