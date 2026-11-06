package com.backend.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.SalePaymentRequest;
import com.backend.dto.SalePaymentResponse;
import com.backend.entity.Sale;
import com.backend.entity.SalePayment;
import com.backend.repository.SalePaymentRepository;
import com.backend.repository.SaleRepository;

@Service
@Transactional
public class SalePaymentServiceImpl implements SalePaymentService {

	private final SalePaymentRepository paymentRepository;

	private final SaleRepository saleRepository;

	public SalePaymentServiceImpl(SalePaymentRepository paymentRepository, SaleRepository saleRepository) {
		this.paymentRepository = paymentRepository;
		this.saleRepository = saleRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<SalePaymentResponse> findAll(Long saleId) {
		List<SalePayment> payments = saleId != null ? paymentRepository.findBySaleIdOrderById(saleId)
				: paymentRepository.findAllByOrderByIdDesc();
		return payments.stream().map(SalePaymentResponse::from).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public SalePaymentResponse findById(Long id) {
		return SalePaymentResponse.from(getPayment(id));
	}

	@Override
	public SalePaymentResponse create(SalePaymentRequest request) {
		SalePayment payment = new SalePayment();
		payment.setSale(getSale(request.saleId()));
		payment.setMethod(request.method());
		payment.setAmount(request.amount());
		return SalePaymentResponse.from(paymentRepository.save(payment));
	}

	@Override
	public SalePaymentResponse update(Long id, SalePaymentRequest request) {
		SalePayment payment = getPayment(id);
		payment.setSale(getSale(request.saleId()));
		payment.setMethod(request.method());
		payment.setAmount(request.amount());
		return SalePaymentResponse.from(paymentRepository.save(payment));
	}

	@Override
	public void delete(Long id) {
		paymentRepository.delete(getPayment(id));
	}

	private SalePayment getPayment(Long id) {
		return paymentRepository.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pagamento de venda não encontrado"));
	}

	private Sale getSale(Long id) {
		if (id == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Venda é obrigatória");
		}
		return saleRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Venda não encontrada"));
	}

}
