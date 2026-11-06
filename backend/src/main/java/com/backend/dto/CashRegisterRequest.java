package com.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

public record CashRegisterRequest(

	Long employeeId,

	Instant openedAt,

	@DecimalMin(value = "0.00", message = "Valor de abertura não pode ser negativo")
	BigDecimal openingAmount,

	Instant closedAt,

	@DecimalMin(value = "0.00", message = "Valor de fechamento não pode ser negativo")
	BigDecimal closingAmount,

	@Size(max = 1000, message = "Observações devem ter no máximo 1000 caracteres")
	String notes

) {}
