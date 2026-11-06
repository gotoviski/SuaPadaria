package com.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.backend.repository.CompanyRepository;

@SpringBootTest
@AutoConfigureMockMvc
class CompanyFlowTests {

	@Autowired
	MockMvc mvc;

	@Autowired
	CompanyRepository companyRepository;

	@Test
	void companyCrud() throws Exception {
		companyRepository.deleteAll();

		mvc.perform(get("/api/company")).andExpect(status().isNotFound());

		String company = """
				{"tradeName": "Padaria Pão Quente", "legalName": "Pão Quente Alimentos LTDA",
				"cnpj": "12345678000199", "email": "contato@paoquente.com", "phone": "+551133334444",
				"zipCode": "01234-567", "street": "Rua das Flores", "number": "100", "district": "Centro",
				"city": "São Paulo", "state": "SP", "openingHours": "Seg-Sáb 6h às 20h"}
				""";

		mvc.perform(put("/api/company").contentType(MediaType.APPLICATION_JSON).content(company))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").exists())
				.andExpect(jsonPath("$.tradeName").value("Padaria Pão Quente"))
				.andExpect(jsonPath("$.city").value("São Paulo"));

		mvc.perform(get("/api/company"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.cnpj").value("12345678000199"));

		mvc.perform(put("/api/company").contentType(MediaType.APPLICATION_JSON)
						.content("{\"tradeName\": \"Padaria Pão Quentinho\", \"cnpj\": \"12345678000199\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.tradeName").value("Padaria Pão Quentinho"))
				.andExpect(jsonPath("$.city").doesNotExist());

		mvc.perform(delete("/api/company")).andExpect(status().isNoContent());

		mvc.perform(get("/api/company")).andExpect(status().isNotFound());
	}

	@Test
	void validationErrorsReturn400() throws Exception {
		mvc.perform(put("/api/company").contentType(MediaType.APPLICATION_JSON)
						.content("{\"tradeName\": \"\", \"cnpj\": \"123\", \"zipCode\": \"abc\"}"))
				.andExpect(status().isBadRequest());
	}

}
