package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.entity.FinancialAccount;

public interface FinancialAccountRepository extends JpaRepository<FinancialAccount, Long> {

	List<FinancialAccount> findAllByOrderByNameAsc();

	List<FinancialAccount> findByNameContainingIgnoreCaseOrBankNameContainingIgnoreCaseOrderByNameAsc(String name,
			String bankName);

}
