package com.backend.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.CashRegisterRequest;
import com.backend.dto.CashRegisterResponse;
import com.backend.entity.CashRegister;
import com.backend.entity.Employee;
import com.backend.repository.CashRegisterRepository;
import com.backend.repository.EmployeeRepository;

@Service
@Transactional
public class CashRegisterServiceImpl implements CashRegisterService {

	private final CashRegisterRepository cashRegisterRepository;

	private final EmployeeRepository employeeRepository;

	public CashRegisterServiceImpl(CashRegisterRepository cashRegisterRepository,
			EmployeeRepository employeeRepository) {
		this.cashRegisterRepository = cashRegisterRepository;
		this.employeeRepository = employeeRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<CashRegisterResponse> findAll(String search) {
		List<CashRegister> cashRegisters = search == null || search.isBlank()
				? cashRegisterRepository.findAllByOrderByOpenedAtDesc()
				: cashRegisterRepository.findByEmployeeNameContainingIgnoreCaseOrderByOpenedAtDesc(search);
		return cashRegisters.stream().map(CashRegisterResponse::from).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public CashRegisterResponse findById(Long id) {
		return CashRegisterResponse.from(getCashRegister(id));
	}

	@Override
	public CashRegisterResponse create(CashRegisterRequest request) {
		CashRegister cashRegister = new CashRegister();
		apply(cashRegister, request);
		return CashRegisterResponse.from(cashRegisterRepository.save(cashRegister));
	}

	@Override
	public CashRegisterResponse update(Long id, CashRegisterRequest request) {
		CashRegister cashRegister = getCashRegister(id);
		apply(cashRegister, request);
		return CashRegisterResponse.from(cashRegisterRepository.save(cashRegister));
	}

	@Override
	public void delete(Long id) {
		cashRegisterRepository.delete(getCashRegister(id));
	}

	private void apply(CashRegister cashRegister, CashRegisterRequest request) {
		cashRegister.setEmployee(getEmployee(request.employeeId()));
		cashRegister.setOpenedAt(request.openedAt() == null ? Instant.now() : request.openedAt());
		cashRegister.setOpeningAmount(request.openingAmount() == null ? BigDecimal.ZERO : request.openingAmount());
		cashRegister.setClosedAt(request.closedAt());
		cashRegister.setClosingAmount(request.closingAmount());
		cashRegister.setNotes(request.notes());
		if (cashRegister.getClosedAt() != null && cashRegister.getClosedAt().isBefore(cashRegister.getOpenedAt())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Data de fechamento não pode ser anterior à abertura");
		}
	}

	private CashRegister getCashRegister(Long id) {
		return cashRegisterRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Caixa não encontrado"));
	}

	private Employee getEmployee(Long id) {
		if (id == null) {
			return null;
		}
		return employeeRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Funcionário não encontrado"));
	}

}
