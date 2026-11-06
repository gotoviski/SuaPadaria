package com.backend.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import com.backend.entity.FinancialAccountType;

public record FinancialAccountRequest(

	@NotBlank(message = "Nome é obrigatório")
	@Size(max = 255, message = "Nome deve ter no máximo 255 caracteres")
	String name,

	@NotNull(message = "Tipo de conta é obrigatório")
	FinancialAccountType type,

	String bankName,

	String agency,

	String accountNumber,

	BigDecimal initialBalance,

	@Size(max = 1000, message = "Observações devem ter no máximo 1000 caracteres")
	String notes,

	Boolean active

) {}
