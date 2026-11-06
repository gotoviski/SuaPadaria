package com.backend.service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.AccountReceivableRequest;
import com.backend.dto.AccountReceivableResponse;
import com.backend.dto.FinancialSettlementRequest;
import com.backend.entity.AccountReceivable;
import com.backend.entity.CashMovementType;
import com.backend.entity.Customer;
import com.backend.entity.FinancialAccount;
import com.backend.entity.FinancialEntry;
import com.backend.entity.ReceivableStatus;
import com.backend.repository.AccountReceivableRepository;
import com.backend.repository.CustomerRepository;
import com.backend.repository.FinancialAccountRepository;
import com.backend.repository.FinancialEntryRepository;

@Service
@Transactional
public class AccountReceivableServiceImpl implements AccountReceivableService {

	private final AccountReceivableRepository receivableRepository;

	private final CustomerRepository customerRepository;

	private final FinancialAccountRepository accountRepository;

	private final FinancialEntryRepository entryRepository;

	public AccountReceivableServiceImpl(AccountReceivableRepository receivableRepository,
			CustomerRepository customerRepository, FinancialAccountRepository accountRepository,
			FinancialEntryRepository entryRepository) {
		this.receivableRepository = receivableRepository;
		this.customerRepository = customerRepository;
		this.accountRepository = accountRepository;
		this.entryRepository = entryRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<AccountReceivableResponse> findAll(ReceivableStatus status, Long customerId) {
		List<AccountReceivable> receivables;
		if (status != null && customerId != null) {
			receivables = receivableRepository.findByStatusAndCustomerIdOrderByDueDateAsc(status, customerId);
		}
		else if (status != null) {
			receivables = receivableRepository.findByStatusOrderByDueDateAsc(status);
		}
		else if (customerId != null) {
			receivables = receivableRepository.findByCustomerIdOrderByDueDateAsc(customerId);
		}
		else {
			receivables = receivableRepository.findAllByOrderByDueDateAsc();
		}
		return receivables.stream().map(AccountReceivableResponse::from).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public AccountReceivableResponse findById(Long id) {
		return AccountReceivableResponse.from(getReceivable(id));
	}

	@Override
	public AccountReceivableResponse create(AccountReceivableRequest request) {
		AccountReceivable receivable = new AccountReceivable();
		apply(receivable, request);
		return AccountReceivableResponse.from(receivableRepository.save(receivable));
	}

	@Override
	public AccountReceivableResponse update(Long id, AccountReceivableRequest request) {
		AccountReceivable receivable = getReceivable(id);
		apply(receivable, request);
		return AccountReceivableResponse.from(receivableRepository.save(receivable));
	}

	@Override
	public AccountReceivableResponse receive(Long id, FinancialSettlementRequest request) {
		AccountReceivable receivable = getReceivable(id);
		if (receivable.getStatus() == ReceivableStatus.RECEIVED) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Conta já está recebida");
		}
		if (receivable.getStatus() == ReceivableStatus.CANCELED) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Conta está cancelada");
		}
		FinancialAccount account = resolveAccount(request.financialAccountId(),
				receivable.getFinancialAccount());
		LocalDate settlementDate = request.settlementDate() == null ? LocalDate.now()
				: request.settlementDate();

		receivable.setFinancialAccount(account);
		receivable.setPaymentMethod(request.paymentMethod() == null ? receivable.getPaymentMethod()
				: request.paymentMethod());
		receivable.setReceivedDate(settlementDate);
		receivable.setStatus(ReceivableStatus.RECEIVED);
		receivableRepository.save(receivable);

		FinancialEntry entry = new FinancialEntry();
		entry.setFinancialAccount(account);
		entry.setType(CashMovementType.ENTRY);
		entry.setAmount(receivable.getAmount());
		entry.setDescription("Recebimento: " + receivable.getDescription());
		entry.setAccountReceivable(receivable);
		entry.setEntryDate(settlementDate.atStartOfDay(ZoneId.systemDefault()).toInstant());
		entryRepository.save(entry);

		return AccountReceivableResponse.from(receivable);
	}

	@Override
	public void delete(Long id) {
		AccountReceivable receivable = getReceivable(id);
		entryRepository.deleteAll(entryRepository.findByAccountReceivableId(id));
		receivableRepository.delete(receivable);
	}

	private void apply(AccountReceivable receivable, AccountReceivableRequest request) {
		receivable.setCustomer(resolveCustomer(request.customerId()));
		receivable.setDescription(request.description());
		receivable.setAmount(request.amount());
		receivable.setDueDate(request.dueDate());
		receivable.setReceivedDate(request.receivedDate());
		receivable.setStatus(request.status() == null ? receivable.getStatus() : request.status());
		receivable.setPaymentMethod(request.paymentMethod());
		receivable.setFinancialAccount(
				resolveAccount(request.financialAccountId(), receivable.getFinancialAccount()));
		receivable.setNotes(request.notes());
	}

	private Customer resolveCustomer(Long customerId) {
		if (customerId == null) {
			return null;
		}
		return customerRepository.findById(customerId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
						"Cliente não encontrado"));
	}

	private FinancialAccount resolveAccount(Long accountId, FinancialAccount fallback) {
		if (accountId == null) {
			return fallback;
		}
		FinancialAccount account = accountRepository.findById(accountId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
						"Conta financeira não encontrada"));
		if (!account.isActive()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Conta financeira está inativa");
		}
		return account;
	}

	private AccountReceivable getReceivable(Long id) {
		return receivableRepository.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conta a receber não encontrada"));
	}

}
