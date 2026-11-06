package com.backend.service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.AccountPayableRequest;
import com.backend.dto.AccountPayableResponse;
import com.backend.dto.FinancialSettlementRequest;
import com.backend.entity.AccountPayable;
import com.backend.entity.CashMovementType;
import com.backend.entity.FinancialAccount;
import com.backend.entity.FinancialEntry;
import com.backend.entity.PayableStatus;
import com.backend.entity.Supplier;
import com.backend.repository.AccountPayableRepository;
import com.backend.repository.FinancialAccountRepository;
import com.backend.repository.FinancialEntryRepository;
import com.backend.repository.SupplierRepository;

@Service
@Transactional
public class AccountPayableServiceImpl implements AccountPayableService {

	private final AccountPayableRepository payableRepository;

	private final SupplierRepository supplierRepository;

	private final FinancialAccountRepository accountRepository;

	private final FinancialEntryRepository entryRepository;

	public AccountPayableServiceImpl(AccountPayableRepository payableRepository,
			SupplierRepository supplierRepository, FinancialAccountRepository accountRepository,
			FinancialEntryRepository entryRepository) {
		this.payableRepository = payableRepository;
		this.supplierRepository = supplierRepository;
		this.accountRepository = accountRepository;
		this.entryRepository = entryRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<AccountPayableResponse> findAll(PayableStatus status, Long supplierId) {
		List<AccountPayable> payables;
		if (status != null && supplierId != null) {
			payables = payableRepository.findByStatusAndSupplierIdOrderByDueDateAsc(status, supplierId);
		}
		else if (status != null) {
			payables = payableRepository.findByStatusOrderByDueDateAsc(status);
		}
		else if (supplierId != null) {
			payables = payableRepository.findBySupplierIdOrderByDueDateAsc(supplierId);
		}
		else {
			payables = payableRepository.findAllByOrderByDueDateAsc();
		}
		return payables.stream().map(AccountPayableResponse::from).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public AccountPayableResponse findById(Long id) {
		return AccountPayableResponse.from(getPayable(id));
	}

	@Override
	public AccountPayableResponse create(AccountPayableRequest request) {
		AccountPayable payable = new AccountPayable();
		apply(payable, request);
		return AccountPayableResponse.from(payableRepository.save(payable));
	}

	@Override
	public AccountPayableResponse update(Long id, AccountPayableRequest request) {
		AccountPayable payable = getPayable(id);
		apply(payable, request);
		return AccountPayableResponse.from(payableRepository.save(payable));
	}

	@Override
	public AccountPayableResponse pay(Long id, FinancialSettlementRequest request) {
		AccountPayable payable = getPayable(id);
		if (payable.getStatus() == PayableStatus.PAID) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Conta já está paga");
		}
		if (payable.getStatus() == PayableStatus.CANCELED) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Conta está cancelada");
		}
		FinancialAccount account = resolveAccount(request.financialAccountId(),
				payable.getFinancialAccount());
		LocalDate settlementDate = request.settlementDate() == null ? LocalDate.now()
				: request.settlementDate();

		payable.setFinancialAccount(account);
		payable.setPaymentMethod(request.paymentMethod() == null ? payable.getPaymentMethod()
				: request.paymentMethod());
		payable.setPaidDate(settlementDate);
		payable.setStatus(PayableStatus.PAID);
		payableRepository.save(payable);

		FinancialEntry entry = new FinancialEntry();
		entry.setFinancialAccount(account);
		entry.setType(CashMovementType.EXIT);
		entry.setAmount(payable.getAmount());
		entry.setDescription("Pagamento: " + payable.getDescription());
		entry.setAccountPayable(payable);
		entry.setEntryDate(settlementDate.atStartOfDay(ZoneId.systemDefault()).toInstant());
		entryRepository.save(entry);

		return AccountPayableResponse.from(payable);
	}

	@Override
	public void delete(Long id) {
		AccountPayable payable = getPayable(id);
		entryRepository.deleteAll(entryRepository.findByAccountPayableId(id));
		payableRepository.delete(payable);
	}

	private void apply(AccountPayable payable, AccountPayableRequest request) {
		payable.setSupplier(resolveSupplier(request.supplierId()));
		payable.setDescription(request.description());
		payable.setCategory(request.category() == null ? payable.getCategory() : request.category());
		payable.setAmount(request.amount());
		payable.setDueDate(request.dueDate());
		payable.setPaidDate(request.paidDate());
		payable.setStatus(request.status() == null ? payable.getStatus() : request.status());
		payable.setPaymentMethod(request.paymentMethod());
		payable.setFinancialAccount(
				resolveAccount(request.financialAccountId(), payable.getFinancialAccount()));
		payable.setNotes(request.notes());
	}

	private Supplier resolveSupplier(Long supplierId) {
		if (supplierId == null) {
			return null;
		}
		return supplierRepository.findById(supplierId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
						"Fornecedor não encontrado"));
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

	private AccountPayable getPayable(Long id) {
		return payableRepository.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conta a pagar não encontrada"));
	}

}
