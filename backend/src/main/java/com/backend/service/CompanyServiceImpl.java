package com.backend.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.CompanyRequest;
import com.backend.dto.CompanyResponse;
import com.backend.entity.Company;
import com.backend.repository.CompanyRepository;

@Service
@Transactional
public class CompanyServiceImpl implements CompanyService {

	private final CompanyRepository companyRepository;

	public CompanyServiceImpl(CompanyRepository companyRepository) {
		this.companyRepository = companyRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public CompanyResponse find() {
		return CompanyResponse.from(getCompany());
	}

	@Override
	public CompanyResponse save(CompanyRequest request) {
		Company company = companyRepository.findTopByOrderByIdAsc().orElseGet(Company::new);
		company.setTradeName(request.tradeName());
		company.setLegalName(request.legalName());
		company.setCnpj(request.cnpj());
		company.setEmail(request.email());
		company.setPhone(request.phone());
		company.setZipCode(request.zipCode());
		company.setStreet(request.street());
		company.setNumber(request.number());
		company.setComplement(request.complement());
		company.setDistrict(request.district());
		company.setCity(request.city());
		company.setState(request.state());
		company.setOpeningHours(request.openingHours());
		company.setLogoUrl(request.logoUrl());
		return CompanyResponse.from(companyRepository.save(company));
	}

	@Override
	public void delete() {
		companyRepository.delete(getCompany());
	}

	private Company getCompany() {
		return companyRepository.findTopByOrderByIdAsc()
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
						"Dados da empresa não cadastrados"));
	}

}
