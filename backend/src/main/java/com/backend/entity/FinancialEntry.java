package com.backend.entity;

import java.math.BigDecimal;
import java.time.Instant;

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
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "financial_entry")
public class FinancialEntry {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "financial_account_id")
	private FinancialAccount financialAccount;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private CashMovementType type;

	@Column(nullable = false, precision = 12, scale = 2)
	private BigDecimal amount;

	@Column(length = 500)
	private String description;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "account_payable_id")
	private AccountPayable accountPayable;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "account_receivable_id")
	private AccountReceivable accountReceivable;

	@Column(nullable = false)
	private Instant entryDate;

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

	public FinancialAccount getFinancialAccount() {
		return financialAccount;
	}

	public void setFinancialAccount(FinancialAccount financialAccount) {
		this.financialAccount = financialAccount;
	}

	public CashMovementType getType() {
		return type;
	}

	public void setType(CashMovementType type) {
		this.type = type;
	}

	public BigDecimal getAmount() {
		return amount;
	}

	public void setAmount(BigDecimal amount) {
		this.amount = amount;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public AccountPayable getAccountPayable() {
		return accountPayable;
	}

	public void setAccountPayable(AccountPayable accountPayable) {
		this.accountPayable = accountPayable;
	}

	public AccountReceivable getAccountReceivable() {
		return accountReceivable;
	}

	public void setAccountReceivable(AccountReceivable accountReceivable) {
		this.accountReceivable = accountReceivable;
	}

	public Instant getEntryDate() {
		return entryDate;
	}

	public void setEntryDate(Instant entryDate) {
		this.entryDate = entryDate;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

}
