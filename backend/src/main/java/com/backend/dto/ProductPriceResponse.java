package com.backend.dto;

import java.math.BigDecimal;

import com.backend.entity.PriceTableItem;

public record ProductPriceResponse(Long id, Long priceTableId, String priceTableName, Long productId,
		String productName, BigDecimal price) {

	public static ProductPriceResponse from(PriceTableItem item) {
		return new ProductPriceResponse(item.getId(), item.getPriceTable().getId(), item.getPriceTable().getName(),
				item.getProduct().getId(), item.getProduct().getName(), item.getPrice());
	}

}
