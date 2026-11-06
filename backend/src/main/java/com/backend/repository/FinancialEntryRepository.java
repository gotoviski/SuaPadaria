package com.backend.repository;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.backend.entity.FinancialEntry;

public interface FinancialEntryRepository extends JpaRepository<FinancialEntry, Long> {

	List<FinancialEntry> findAllByOrderByEntryDateDesc();

	List<FinancialEntry> findByFinancialAccountIdOrderByEntryDateDesc(Long financialAccountId);

	List<FinancialEntry> findByAccountPayableId(Long accountPayableId);

	List<FinancialEntry> findByAccountReceivableId(Long accountReceivableId);

	boolean existsByFinancialAccountId(Long financialAccountId);

	@Query("SELECT COALESCE(SUM(CASE WHEN e.type = com.backend.entity.CashMovementType.ENTRY THEN e.amount "
			+ "ELSE -e.amount END), 0) FROM FinancialEntry e WHERE e.financialAccount.id = :accountId")
	BigDecimal balanceByAccountId(Long accountId);

}
