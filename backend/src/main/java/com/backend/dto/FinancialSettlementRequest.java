package com.backend.dto;

import java.time.LocalDate;

import com.backend.entity.PaymentMethod;

public record FinancialSettlementRequest(

	Long financialAccountId,

	PaymentMethod paymentMethod,

	LocalDate settlementDate

) {}
