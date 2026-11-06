package com.backend.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "production_order")
public class ProductionOrder {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "recipe_id")
	private Recipe recipe;

	@Column(nullable = false, precision = 10, scale = 3)
	private BigDecimal plannedQuantity;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private ProductionStatus status = ProductionStatus.OPEN;

	private Instant scheduledDate;

	private Instant startedAt;

	private Instant finishedAt;

	@Column(length = 1000)
	private String notes;

	@OneToMany(mappedBy = "productionOrder", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<ProductionConsumption> consumptions = new ArrayList<>();

	@OneToMany(mappedBy = "productionOrder", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<ProductionResult> results = new ArrayList<>();

	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	@Column(nullable = false)
	private Instant updatedAt;

	@PrePersist
	void onCreate() {
		this.createdAt = Instant.now();
		this.updatedAt = this.createdAt;
	}

	@PreUpdate
	void onUpdate() {
		this.updatedAt = Instant.now();
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Recipe getRecipe() {
		return recipe;
	}

	public void setRecipe(Recipe recipe) {
		this.recipe = recipe;
	}

	public BigDecimal getPlannedQuantity() {
		return plannedQuantity;
	}

	public void setPlannedQuantity(BigDecimal plannedQuantity) {
		this.plannedQuantity = plannedQuantity;
	}

	public ProductionStatus getStatus() {
		return status;
	}

	public void setStatus(ProductionStatus status) {
		this.status = status;
	}

	public Instant getScheduledDate() {
		return scheduledDate;
	}

	public void setScheduledDate(Instant scheduledDate) {
		this.scheduledDate = scheduledDate;
	}

	public Instant getStartedAt() {
		return startedAt;
	}

	public void setStartedAt(Instant startedAt) {
		this.startedAt = startedAt;
	}

	public Instant getFinishedAt() {
		return finishedAt;
	}

	public void setFinishedAt(Instant finishedAt) {
		this.finishedAt = finishedAt;
	}

	public String getNotes() {
		return notes;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

	public List<ProductionConsumption> getConsumptions() {
		return consumptions;
	}

	public void setConsumptions(List<ProductionConsumption> consumptions) {
		this.consumptions = consumptions;
	}

	public List<ProductionResult> getResults() {
		return results;
	}

	public void setResults(List<ProductionResult> results) {
		this.results = results;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

}
