package com.backend.dto;

import java.time.Instant;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PurchaseRequest(

	@NotNull(message = "Fornecedor é obrigatório")
	Long supplierId,

	Instant purchaseDate,

	@Size(max = 1000, message = "Observações devem ter no máximo 1000 caracteres")
	String notes,

	@NotEmpty(message = "Compra deve ter pelo menos um item")
	List<@Valid PurchaseItemRequest> items

) {}
