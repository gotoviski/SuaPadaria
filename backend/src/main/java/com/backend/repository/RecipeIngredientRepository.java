package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.entity.RecipeIngredient;

public interface RecipeIngredientRepository extends JpaRepository<RecipeIngredient, Long> {

	List<RecipeIngredient> findByRecipeIdOrderByProductName(Long recipeId);

	List<RecipeIngredient> findByProductIdOrderByRecipeProductName(Long productId);

	List<RecipeIngredient> findByProductNameContainingIgnoreCaseOrderByProductName(String name);

	boolean existsByRecipeIdAndProductId(Long recipeId, Long productId);

}
