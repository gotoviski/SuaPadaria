package com.backend.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PriceTableRequest(

	@NotBlank(message = "Nome é obrigatório")
	String name,

	@Size(max = 1000, message = "Descrição deve ter no máximo 1000 caracteres")
	String description,

	Boolean active,

	List<@Valid PriceTableItemRequest> items

) {}
