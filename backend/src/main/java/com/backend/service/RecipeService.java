package com.backend.service;

import java.util.List;

import com.backend.dto.RecipeRequest;
import com.backend.dto.RecipeResponse;

public interface RecipeService {

	List<RecipeResponse> findAll(String search);

	RecipeResponse findById(Long id);

	RecipeResponse create(RecipeRequest request);

	RecipeResponse update(Long id, RecipeRequest request);

	void delete(Long id);

}
