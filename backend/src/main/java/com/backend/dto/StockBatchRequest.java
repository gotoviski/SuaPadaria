package com.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record StockBatchRequest(

	@NotNull(message = "Produto é obrigatório")
	Long productId,

	@NotNull(message = "Local de estoque é obrigatório")
	Long locationId,

	@NotBlank(message = "Número do lote é obrigatório")
	String batchNumber,

	@DecimalMin(value = "0.00", message = "Quantidade não pode ser negativa")
	BigDecimal quantity,

	LocalDate manufactureDate,

	LocalDate expirationDate,

	@Size(max = 1000, message = "Observações devem ter no máximo 1000 caracteres")
	String notes

) {}
