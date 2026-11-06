package com.backend.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.backend.dto.RecipeIngredientRequest;
import com.backend.dto.RecipeIngredientResponse;
import com.backend.service.RecipeIngredientService;

@RestController
@RequestMapping("/api/recipe-ingredients")
public class RecipeIngredientController {

	private final RecipeIngredientService recipeIngredientService;

	public RecipeIngredientController(RecipeIngredientService recipeIngredientService) {
		this.recipeIngredientService = recipeIngredientService;
	}

	@GetMapping
	public List<RecipeIngredientResponse> findAll(@RequestParam(required = false) Long recipeId,
			@RequestParam(required = false) Long productId, @RequestParam(required = false) String search) {
		return recipeIngredientService.findAll(recipeId, productId, search);
	}

	@GetMapping("/{id}")
	public RecipeIngredientResponse findById(@PathVariable Long id) {
		return recipeIngredientService.findById(id);
	}

	@PostMapping
	public ResponseEntity<RecipeIngredientResponse> create(@Valid @RequestBody RecipeIngredientRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(recipeIngredientService.create(request));
	}

	@PutMapping("/{id}")
	public RecipeIngredientResponse update(@PathVariable Long id, @Valid @RequestBody RecipeIngredientRequest request) {
		return recipeIngredientService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		recipeIngredientService.delete(id);
		return ResponseEntity.noContent().build();
	}

}
