package com.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import com.backend.entity.PayableCategory;
import com.backend.entity.PayableStatus;
import com.backend.entity.PaymentMethod;

public record AccountPayableRequest(

	Long supplierId,

	@NotBlank(message = "Descrição é obrigatória")
	@Size(max = 255, message = "Descrição deve ter no máximo 255 caracteres")
	String description,

	PayableCategory category,

	@NotNull(message = "Valor é obrigatório")
	@DecimalMin(value = "0.01", message = "Valor deve ser maior que zero")
	BigDecimal amount,

	@NotNull(message = "Data de vencimento é obrigatória")
	LocalDate dueDate,

	LocalDate paidDate,

	PayableStatus status,

	PaymentMethod paymentMethod,

	Long financialAccountId,

	@Size(max = 1000, message = "Observações devem ter no máximo 1000 caracteres")
	String notes

) {}
