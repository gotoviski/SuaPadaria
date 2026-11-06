package com.backend.dto;

import java.time.Instant;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import com.backend.entity.InventoryStatus;

public record InventoryRequest(

	@NotNull(message = "Local de estoque é obrigatório")
	Long locationId,

	Instant inventoryDate,

	InventoryStatus status,

	@Size(max = 1000, message = "Observações devem ter no máximo 1000 caracteres")
	String notes,

	@NotEmpty(message = "Inventário deve ter pelo menos um item")
	List<@Valid InventoryItemRequest> items

) {}
