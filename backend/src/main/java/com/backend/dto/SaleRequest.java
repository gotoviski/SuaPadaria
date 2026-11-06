package com.backend.dto;

import java.time.Instant;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

public record SaleRequest(

	Long customerId,

	Long employeeId,

	Long cashRegisterId,

	Instant saleDate,

	@Size(max = 1000, message = "Observações devem ter no máximo 1000 caracteres")
	String notes,

	@NotEmpty(message = "Venda deve ter pelo menos um item")
	List<@Valid SaleItemRequest> items,

	List<@Valid SalePaymentRequest> payments

) {}
