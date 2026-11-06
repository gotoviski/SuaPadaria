package com.backend.service;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.SaleItemRequest;
import com.backend.dto.SalePaymentRequest;
import com.backend.dto.SaleRequest;
import com.backend.dto.SaleResponse;
import com.backend.entity.CashRegister;
import com.backend.entity.CashRegisterStatus;
import com.backend.entity.Customer;
import com.backend.entity.Employee;
import com.backend.entity.Product;
import com.backend.entity.Sale;
import com.backend.entity.SaleItem;
import com.backend.entity.SalePayment;
import com.backend.repository.CashRegisterRepository;
import com.backend.repository.CustomerRepository;
import com.backend.repository.EmployeeRepository;
import com.backend.repository.ProductRepository;
import com.backend.repository.SaleRepository;

@Service
@Transactional
public class SaleServiceImpl implements SaleService {

	private final SaleRepository saleRepository;

	private final CustomerRepository customerRepository;

	private final EmployeeRepository employeeRepository;

	private final CashRegisterRepository cashRegisterRepository;

	private final ProductRepository productRepository;

	public SaleServiceImpl(SaleRepository saleRepository, CustomerRepository customerRepository,
			EmployeeRepository employeeRepository, CashRegisterRepository cashRegisterRepository,
			ProductRepository productRepository) {
		this.saleRepository = saleRepository;
		this.customerRepository = customerRepository;
		this.employeeRepository = employeeRepository;
		this.cashRegisterRepository = cashRegisterRepository;
		this.productRepository = productRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<SaleResponse> findAll(String search) {
		List<Sale> sales = search == null || search.isBlank()
				? saleRepository.findAllByOrderBySaleDateDesc()
				: saleRepository.findByCustomerNameContainingIgnoreCaseOrderBySaleDateDesc(search);
		return sales.stream().map(SaleResponse::from).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public SaleResponse findById(Long id) {
		return SaleResponse.from(getSale(id));
	}

	@Override
	public SaleResponse create(SaleRequest request) {
		Sale sale = new Sale();
		apply(sale, request);
		return SaleResponse.from(saleRepository.save(sale));
	}

	@Override
	public SaleResponse update(Long id, SaleRequest request) {
		Sale sale = getSale(id);
		apply(sale, request);
		return SaleResponse.from(saleRepository.save(sale));
	}

	@Override
	public void delete(Long id) {
		saleRepository.delete(getSale(id));
	}

	private void apply(Sale sale, SaleRequest request) {
		sale.setCustomer(getCustomer(request.customerId()));
		sale.setEmployee(getEmployee(request.employeeId()));
		sale.setCashRegister(getCashRegister(sale, request.cashRegisterId()));
		sale.setSaleDate(request.saleDate() == null ? Instant.now() : request.saleDate());
		sale.setNotes(request.notes());
		sale.getItems().clear();
		Set<Long> seen = new HashSet<>();
		for (SaleItemRequest itemRequest : request.items()) {
			if (!seen.add(itemRequest.productId())) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto duplicado na venda");
			}
			Product product = productRepository.findById(itemRequest.productId())
					.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto não encontrado"));
			SaleItem item = new SaleItem();
			item.setSale(sale);
			item.setProduct(product);
			item.setQuantity(itemRequest.quantity());
			item.setUnitPrice(itemRequest.unitPrice());
			sale.getItems().add(item);
		}
		sale.getPayments().clear();
		if (request.payments() != null) {
			for (SalePaymentRequest paymentRequest : request.payments()) {
				SalePayment payment = new SalePayment();
				payment.setSale(sale);
				payment.setMethod(paymentRequest.method());
				payment.setAmount(paymentRequest.amount());
				sale.getPayments().add(payment);
			}
		}
	}

	private Sale getSale(Long id) {
		return saleRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Venda não encontrada"));
	}

	private Customer getCustomer(Long id) {
		if (id == null) {
			return null;
		}
		return customerRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cliente não encontrado"));
	}

	private Employee getEmployee(Long id) {
		if (id == null) {
			return null;
		}
		return employeeRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Funcionário não encontrado"));
	}

	private CashRegister getCashRegister(Sale sale, Long id) {
		if (id == null) {
			return null;
		}
		CashRegister cashRegister = cashRegisterRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Caixa não encontrado"));
		boolean sameRegister = sale.getCashRegister() != null && sale.getCashRegister().getId().equals(id);
		if (!sameRegister && cashRegister.getStatus() == CashRegisterStatus.CLOSED) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Caixa está fechado");
		}
		return cashRegister;
	}

}
