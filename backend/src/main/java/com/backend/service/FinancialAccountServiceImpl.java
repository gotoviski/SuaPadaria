package com.backend.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.FinancialAccountRequest;
import com.backend.dto.FinancialAccountResponse;
import com.backend.entity.FinancialAccount;
import com.backend.repository.FinancialAccountRepository;
import com.backend.repository.FinancialEntryRepository;

@Service
@Transactional
public class FinancialAccountServiceImpl implements FinancialAccountService {

	private final FinancialAccountRepository accountRepository;

	private final FinancialEntryRepository entryRepository;

	public FinancialAccountServiceImpl(FinancialAccountRepository accountRepository,
			FinancialEntryRepository entryRepository) {
		this.accountRepository = accountRepository;
		this.entryRepository = entryRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<FinancialAccountResponse> findAll(String search) {
		List<FinancialAccount> accounts = search == null || search.isBlank()
				? accountRepository.findAllByOrderByNameAsc()
				: accountRepository
						.findByNameContainingIgnoreCaseOrBankNameContainingIgnoreCaseOrderByNameAsc(search,
								search);
		return accounts.stream().map(this::toResponse).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public FinancialAccountResponse findById(Long id) {
		return toResponse(getAccount(id));
	}

	@Override
	public FinancialAccountResponse create(FinancialAccountRequest request) {
		FinancialAccount account = new FinancialAccount();
		account.setActive(request.active() == null || request.active());
		apply(account, request);
		return toResponse(accountRepository.save(account));
	}

	@Override
	public FinancialAccountResponse update(Long id, FinancialAccountRequest request) {
		FinancialAccount account = getAccount(id);
		apply(account, request);
		account.setActive(request.active() == null || request.active());
		return toResponse(accountRepository.save(account));
	}

	@Override
	public void delete(Long id) {
		FinancialAccount account = getAccount(id);
		if (entryRepository.existsByFinancialAccountId(id)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT,
					"Conta financeira possui lançamentos e não pode ser excluída");
		}
		accountRepository.delete(account);
	}

	private void apply(FinancialAccount account, FinancialAccountRequest request) {
		account.setName(request.name());
		account.setType(request.type());
		account.setBankName(request.bankName());
		account.setAgency(request.agency());
		account.setAccountNumber(request.accountNumber());
		account.setInitialBalance(
				request.initialBalance() == null ? BigDecimal.ZERO : request.initialBalance());
		account.setNotes(request.notes());
	}

	private FinancialAccountResponse toResponse(FinancialAccount account) {
		return FinancialAccountResponse.from(account, balanceOf(account.getId()));
	}

	private BigDecimal balanceOf(Long accountId) {
		FinancialAccount account = accountRepository.findById(accountId).orElseThrow();
		BigDecimal entriesBalance = entryRepository.balanceByAccountId(accountId);
		return account.getInitialBalance()
				.add(entriesBalance == null ? BigDecimal.ZERO : entriesBalance);
	}

	private FinancialAccount getAccount(Long id) {
		return accountRepository.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conta financeira não encontrada"));
	}

}
