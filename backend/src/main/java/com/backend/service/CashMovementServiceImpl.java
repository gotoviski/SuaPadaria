package com.backend.service;

import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.CashMovementRequest;
import com.backend.dto.CashMovementResponse;
import com.backend.entity.CashMovement;
import com.backend.entity.CashRegister;
import com.backend.entity.CashRegisterStatus;
import com.backend.repository.CashMovementRepository;
import com.backend.repository.CashRegisterRepository;

@Service
@Transactional
public class CashMovementServiceImpl implements CashMovementService {

	private final CashMovementRepository movementRepository;

	private final CashRegisterRepository cashRegisterRepository;

	public CashMovementServiceImpl(CashMovementRepository movementRepository,
			CashRegisterRepository cashRegisterRepository) {
		this.movementRepository = movementRepository;
		this.cashRegisterRepository = cashRegisterRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<CashMovementResponse> findAll(Long cashRegisterId) {
		List<CashMovement> movements = cashRegisterId != null
				? movementRepository.findByCashRegisterIdOrderByMovementDateDesc(cashRegisterId)
				: movementRepository.findAllByOrderByMovementDateDesc();
		return movements.stream().map(CashMovementResponse::from).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public CashMovementResponse findById(Long id) {
		return CashMovementResponse.from(getMovement(id));
	}

	@Override
	public CashMovementResponse create(CashMovementRequest request) {
		CashMovement movement = new CashMovement();
		movement.setCashRegister(getOpenCashRegister(request.cashRegisterId()));
		movement.setType(request.type());
		movement.setAmount(request.amount());
		movement.setDescription(request.description());
		movement.setMovementDate(request.movementDate() == null ? Instant.now() : request.movementDate());
		return CashMovementResponse.from(movementRepository.save(movement));
	}

	@Override
	public CashMovementResponse update(Long id, CashMovementRequest request) {
		CashMovement movement = getMovement(id);
		movement.setCashRegister(getOpenCashRegister(request.cashRegisterId()));
		movement.setType(request.type());
		movement.setAmount(request.amount());
		movement.setDescription(request.description());
		movement.setMovementDate(request.movementDate() == null ? movement.getMovementDate()
				: request.movementDate());
		return CashMovementResponse.from(movementRepository.save(movement));
	}

	@Override
	public void delete(Long id) {
		movementRepository.delete(getMovement(id));
	}

	private CashMovement getMovement(Long id) {
		return movementRepository.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movimentação de caixa não encontrada"));
	}

	private CashRegister getOpenCashRegister(Long id) {
		if (id == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Caixa é obrigatório");
		}
		CashRegister cashRegister = cashRegisterRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Caixa não encontrado"));
		if (cashRegister.getStatus() == CashRegisterStatus.CLOSED) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Caixa está fechado");
		}
		return cashRegister;
	}

}
