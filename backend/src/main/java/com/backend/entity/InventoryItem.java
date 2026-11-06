package com.backend.entity;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "inventory_item")
public class InventoryItem {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "inventory_id")
	private Inventory inventory;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "product_id")
	private Product product;

	@Column(nullable = false, precision = 10, scale = 3)
	private BigDecimal expectedQuantity;

	@Column(nullable = false, precision = 10, scale = 3)
	private BigDecimal countedQuantity;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Inventory getInventory() {
		return inventory;
	}

	public void setInventory(Inventory inventory) {
		this.inventory = inventory;
	}

	public Product getProduct() {
		return product;
	}

	public void setProduct(Product product) {
		this.product = product;
	}

	public BigDecimal getExpectedQuantity() {
		return expectedQuantity;
	}

	public void setExpectedQuantity(BigDecimal expectedQuantity) {
		this.expectedQuantity = expectedQuantity;
	}

	public BigDecimal getCountedQuantity() {
		return countedQuantity;
	}

	public void setCountedQuantity(BigDecimal countedQuantity) {
		this.countedQuantity = countedQuantity;
	}

}
