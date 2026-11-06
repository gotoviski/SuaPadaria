package com.backend.entity;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "cash_register")
public class CashRegister {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "employee_id")
	private Employee employee;

	@Column(nullable = false)
	private Instant openedAt;

	private Instant closedAt;

	@Column(nullable = false, precision = 10, scale = 2)
	private BigDecimal openingAmount = BigDecimal.ZERO;

	@Column(precision = 10, scale = 2)
	private BigDecimal closingAmount;

	@Column(length = 1000)
	private String notes;

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

	public Employee getEmployee() {
		return employee;
	}

	public void setEmployee(Employee employee) {
		this.employee = employee;
	}

	public Instant getOpenedAt() {
		return openedAt;
	}

	public void setOpenedAt(Instant openedAt) {
		this.openedAt = openedAt;
	}

	public Instant getClosedAt() {
		return closedAt;
	}

	public void setClosedAt(Instant closedAt) {
		this.closedAt = closedAt;
	}

	public BigDecimal getOpeningAmount() {
		return openingAmount;
	}

	public void setOpeningAmount(BigDecimal openingAmount) {
		this.openingAmount = openingAmount;
	}

	public BigDecimal getClosingAmount() {
		return closingAmount;
	}

	public void setClosingAmount(BigDecimal closingAmount) {
		this.closingAmount = closingAmount;
	}

	public String getNotes() {
		return notes;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

	public CashRegisterStatus getStatus() {
		return closedAt != null ? CashRegisterStatus.CLOSED : CashRegisterStatus.OPEN;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

}
