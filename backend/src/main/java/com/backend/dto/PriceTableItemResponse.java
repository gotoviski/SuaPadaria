package com.backend.dto;

import java.math.BigDecimal;

import com.backend.entity.PriceTableItem;

public record PriceTableItemResponse(Long id, Long productId, String productName, BigDecimal price) {

	public static PriceTableItemResponse from(PriceTableItem item) {
		return new PriceTableItemResponse(item.getId(), item.getProduct().getId(), item.getProduct().getName(),
				item.getPrice());
	}

}
