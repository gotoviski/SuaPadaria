package com.backend.service;

import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.FinancialEntryRequest;
import com.backend.dto.FinancialEntryResponse;
import com.backend.entity.AccountPayable;
import com.backend.entity.AccountReceivable;
import com.backend.entity.FinancialAccount;
import com.backend.entity.FinancialEntry;
import com.backend.repository.AccountPayableRepository;
import com.backend.repository.AccountReceivableRepository;
import com.backend.repository.FinancialAccountRepository;
import com.backend.repository.FinancialEntryRepository;

@Service
@Transactional
public class FinancialEntryServiceImpl implements FinancialEntryService {

	private final FinancialEntryRepository entryRepository;

	private final FinancialAccountRepository accountRepository;

	private final AccountPayableRepository payableRepository;

	private final AccountReceivableRepository receivableRepository;

	public FinancialEntryServiceImpl(FinancialEntryRepository entryRepository,
			FinancialAccountRepository accountRepository, AccountPayableRepository payableRepository,
			AccountReceivableRepository receivableRepository) {
		this.entryRepository = entryRepository;
		this.accountRepository = accountRepository;
		this.payableRepository = payableRepository;
		this.receivableRepository = receivableRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<FinancialEntryResponse> findAll(Long financialAccountId) {
		List<FinancialEntry> entries = financialAccountId != null
				? entryRepository.findByFinancialAccountIdOrderByEntryDateDesc(financialAccountId)
				: entryRepository.findAllByOrderByEntryDateDesc();
		return entries.stream().map(FinancialEntryResponse::from).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public FinancialEntryResponse findById(Long id) {
		return FinancialEntryResponse.from(getEntry(id));
	}

	@Override
	public FinancialEntryResponse create(FinancialEntryRequest request) {
		FinancialEntry entry = new FinancialEntry();
		apply(entry, request);
		entry.setEntryDate(request.entryDate() == null ? Instant.now() : request.entryDate());
		return FinancialEntryResponse.from(entryRepository.save(entry));
	}

	@Override
	public FinancialEntryResponse update(Long id, FinancialEntryRequest request) {
		FinancialEntry entry = getEntry(id);
		apply(entry, request);
		entry.setEntryDate(
				request.entryDate() == null ? entry.getEntryDate() : request.entryDate());
		return FinancialEntryResponse.from(entryRepository.save(entry));
	}

	@Override
	public void delete(Long id) {
		entryRepository.delete(getEntry(id));
	}

	private void apply(FinancialEntry entry, FinancialEntryRequest request) {
		entry.setFinancialAccount(getActiveAccount(request.financialAccountId()));
		entry.setType(request.type());
		entry.setAmount(request.amount());
		entry.setDescription(request.description());
		entry.setAccountPayable(resolvePayable(request.accountPayableId()));
		entry.setAccountReceivable(resolveReceivable(request.accountReceivableId()));
	}

	private FinancialAccount getActiveAccount(Long id) {
		FinancialAccount account = accountRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
						"Conta financeira não encontrada"));
		if (!account.isActive()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Conta financeira está inativa");
		}
		return account;
	}

	private AccountPayable resolvePayable(Long id) {
		if (id == null) {
			return null;
		}
		return payableRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
						"Conta a pagar não encontrada"));
	}

	private AccountReceivable resolveReceivable(Long id) {
		if (id == null) {
			return null;
		}
		return receivableRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
						"Conta a receber não encontrada"));
	}

	private FinancialEntry getEntry(Long id) {
		return entryRepository.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lançamento não encontrado"));
	}

}
