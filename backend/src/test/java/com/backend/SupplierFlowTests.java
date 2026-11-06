package com.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
class SupplierFlowTests {

	@Autowired
	MockMvc mvc;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void supplierCrud() throws Exception {
		String supplier = """
				{"name": "Moinho Trigo Bom", "legalName": "Moinho Trigo Bom LTDA",
				"cnpj": "12345678000199", "contactName": "Carlos Souza", "phone": "+5511988877766",
				"email": "vendas@trigobom.com", "zipCode": "01234-567", "street": "Rodovia dos Moinhos",
				"number": "1000", "district": "Industrial", "city": "São Paulo", "state": "SP",
				"notes": "Entrega farinha às segundas e quintas"}
				""";

		MvcResult created = mvc.perform(post("/api/suppliers").contentType(MediaType.APPLICATION_JSON).content(supplier))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").exists())
				.andExpect(jsonPath("$.name").value("Moinho Trigo Bom"))
				.andExpect(jsonPath("$.active").value(true))
				.andReturn();
		long id = readId(created);

		mvc.perform(post("/api/suppliers").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"Outro Fornecedor\", \"cnpj\": \"12345678000199\"}"))
				.andExpect(status().isConflict());

		mvc.perform(get("/api/suppliers"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").exists());

		mvc.perform(get("/api/suppliers").param("search", "carlos"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].name").value("Moinho Trigo Bom"));

		mvc.perform(get("/api/suppliers/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.cnpj").value("12345678000199"))
				.andExpect(jsonPath("$.city").value("São Paulo"));

		mvc.perform(put("/api/suppliers/" + id).contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"Moinho Trigo Ótimo\", \"active\": false}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value("Moinho Trigo Ótimo"))
				.andExpect(jsonPath("$.active").value(false))
				.andExpect(jsonPath("$.city").doesNotExist());

		mvc.perform(delete("/api/suppliers/" + id)).andExpect(status().isNoContent());

		mvc.perform(get("/api/suppliers/" + id)).andExpect(status().isNotFound());
	}

	@Test
	void validationErrorsReturn400() throws Exception {
		mvc.perform(post("/api/suppliers").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"\"}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/suppliers").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"Fornecedor\", \"cnpj\": \"123\", \"zipCode\": \"abc\", \"email\": \"invalido\"}"))
				.andExpect(status().isBadRequest());
	}

	private long readId(MvcResult result) throws Exception {
		JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
		return node.get("id").asLong();
	}

}
