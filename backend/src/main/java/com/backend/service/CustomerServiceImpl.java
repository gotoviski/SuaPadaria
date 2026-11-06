package com.backend.service;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.CustomerRequest;
import com.backend.dto.CustomerResponse;
import com.backend.entity.Customer;
import com.backend.repository.CustomerRepository;

@Service
@Transactional
public class CustomerServiceImpl implements CustomerService {

	private final CustomerRepository customerRepository;

	public CustomerServiceImpl(CustomerRepository customerRepository) {
		this.customerRepository = customerRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<CustomerResponse> findAll(String search) {
		List<Customer> customers = search == null || search.isBlank()
				? customerRepository.findAll(Sort.by("name"))
				: customerRepository.findByNameContainingIgnoreCaseOrPhoneContainingOrderByName(search, search);
		return customers.stream().map(CustomerResponse::from).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public CustomerResponse findById(Long id) {
		return CustomerResponse.from(getCustomer(id));
	}

	@Override
	public CustomerResponse create(CustomerRequest request) {
		if (request.cpf() != null && customerRepository.existsByCpf(request.cpf())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "CPF já cadastrado");
		}
		Customer customer = new Customer();
		customer.setActive(request.active() == null || request.active());
		apply(customer, request);
		return CustomerResponse.from(customerRepository.save(customer));
	}

	@Override
	public CustomerResponse update(Long id, CustomerRequest request) {
		Customer customer = getCustomer(id);
		if (request.cpf() != null && !request.cpf().equals(customer.getCpf())
				&& customerRepository.existsByCpf(request.cpf())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "CPF já cadastrado");
		}
		apply(customer, request);
		customer.setActive(request.active() == null || request.active());
		return CustomerResponse.from(customerRepository.save(customer));
	}

	@Override
	public void delete(Long id) {
		customerRepository.delete(getCustomer(id));
	}

	private void apply(Customer customer, CustomerRequest request) {
		customer.setName(request.name());
		customer.setPhone(request.phone());
		customer.setEmail(request.email());
		customer.setCpf(request.cpf());
		customer.setBirthDate(request.birthDate());
		customer.setZipCode(request.zipCode());
		customer.setStreet(request.street());
		customer.setNumber(request.number());
		customer.setComplement(request.complement());
		customer.setDistrict(request.district());
		customer.setCity(request.city());
		customer.setState(request.state());
		customer.setNotes(request.notes());
	}

	private Customer getCustomer(Long id) {
		return customerRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente não encontrado"));
	}

}
