package com.backend.service;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.SupplierRequest;
import com.backend.dto.SupplierResponse;
import com.backend.entity.Supplier;
import com.backend.repository.SupplierRepository;

@Service
@Transactional
public class SupplierServiceImpl implements SupplierService {

	private final SupplierRepository supplierRepository;

	public SupplierServiceImpl(SupplierRepository supplierRepository) {
		this.supplierRepository = supplierRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<SupplierResponse> findAll(String search) {
		List<Supplier> suppliers = search == null || search.isBlank()
				? supplierRepository.findAll(Sort.by("name"))
				: supplierRepository
						.findByNameContainingIgnoreCaseOrContactNameContainingIgnoreCaseOrPhoneContainingOrderByName(
								search, search, search);
		return suppliers.stream().map(SupplierResponse::from).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public SupplierResponse findById(Long id) {
		return SupplierResponse.from(getSupplier(id));
	}

	@Override
	public SupplierResponse create(SupplierRequest request) {
		if (request.cnpj() != null && supplierRepository.existsByCnpj(request.cnpj())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "CNPJ já cadastrado");
		}
		Supplier supplier = new Supplier();
		supplier.setActive(request.active() == null || request.active());
		apply(supplier, request);
		return SupplierResponse.from(supplierRepository.save(supplier));
	}

	@Override
	public SupplierResponse update(Long id, SupplierRequest request) {
		Supplier supplier = getSupplier(id);
		if (request.cnpj() != null && !request.cnpj().equals(supplier.getCnpj())
				&& supplierRepository.existsByCnpj(request.cnpj())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "CNPJ já cadastrado");
		}
		apply(supplier, request);
		supplier.setActive(request.active() == null || request.active());
		return SupplierResponse.from(supplierRepository.save(supplier));
	}

	@Override
	public void delete(Long id) {
		supplierRepository.delete(getSupplier(id));
	}

	private void apply(Supplier supplier, SupplierRequest request) {
		supplier.setName(request.name());
		supplier.setLegalName(request.legalName());
		supplier.setCnpj(request.cnpj());
		supplier.setContactName(request.contactName());
		supplier.setPhone(request.phone());
		supplier.setEmail(request.email());
		supplier.setZipCode(request.zipCode());
		supplier.setStreet(request.street());
		supplier.setNumber(request.number());
		supplier.setComplement(request.complement());
		supplier.setDistrict(request.district());
		supplier.setCity(request.city());
		supplier.setState(request.state());
		supplier.setNotes(request.notes());
	}

	private Supplier getSupplier(Long id) {
		return supplierRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fornecedor não encontrado"));
	}

}
