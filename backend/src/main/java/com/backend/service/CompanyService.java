package com.backend.service;

import com.backend.dto.CompanyRequest;
import com.backend.dto.CompanyResponse;

public interface CompanyService {

	CompanyResponse find();

	CompanyResponse save(CompanyRequest request);

	void delete();

}
