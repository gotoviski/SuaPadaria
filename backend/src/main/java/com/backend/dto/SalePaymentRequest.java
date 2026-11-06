package com.backend.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import com.backend.entity.PaymentMethod;

public record SalePaymentRequest(

	Long saleId,

	@NotNull(message = "Forma de pagamento é obrigatória")
	PaymentMethod method,

	@NotNull(message = "Valor é obrigatório")
	@DecimalMin(value = "0.01", message = "Valor deve ser maior que zero")
	BigDecimal amount

) {}
