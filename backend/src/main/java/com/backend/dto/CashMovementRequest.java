package com.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import com.backend.entity.CashMovementType;

public record CashMovementRequest(

	@NotNull(message = "Caixa é obrigatório")
	Long cashRegisterId,

	@NotNull(message = "Tipo de movimentação é obrigatório")
	CashMovementType type,

	@NotNull(message = "Valor é obrigatório")
	@DecimalMin(value = "0.01", message = "Valor deve ser maior que zero")
	BigDecimal amount,

	@Size(max = 500, message = "Descrição deve ter no máximo 500 caracteres")
	String description,

	Instant movementDate

) {}
