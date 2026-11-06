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
class CustomerFlowTests {

	@Autowired
	MockMvc mvc;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void customerCrud() throws Exception {
		String customer = """
				{"name": "Maria Silva", "phone": "+5511998887777", "email": "maria@email.com",
				"cpf": "12345678901", "birthDate": "1990-05-20", "zipCode": "01234-567",
				"street": "Rua das Flores", "number": "100", "district": "Centro",
				"city": "São Paulo", "state": "SP", "notes": "Prefere pão integral"}
				""";

		MvcResult created = mvc.perform(post("/api/customers").contentType(MediaType.APPLICATION_JSON).content(customer))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").exists())
				.andExpect(jsonPath("$.name").value("Maria Silva"))
				.andExpect(jsonPath("$.active").value(true))
				.andReturn();
		long id = readId(created);

		mvc.perform(post("/api/customers").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"João\", \"phone\": \"11999990000\", \"cpf\": \"12345678901\"}"))
				.andExpect(status().isConflict());

		mvc.perform(get("/api/customers"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").exists());

		mvc.perform(get("/api/customers").param("search", "maria"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].name").value("Maria Silva"));

		mvc.perform(get("/api/customers/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.cpf").value("12345678901"))
				.andExpect(jsonPath("$.city").value("São Paulo"));

		mvc.perform(put("/api/customers/" + id).contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"Maria Souza\", \"phone\": \"+5511998887777\", \"active\": false}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value("Maria Souza"))
				.andExpect(jsonPath("$.active").value(false))
				.andExpect(jsonPath("$.city").doesNotExist());

		mvc.perform(delete("/api/customers/" + id)).andExpect(status().isNoContent());

		mvc.perform(get("/api/customers/" + id)).andExpect(status().isNotFound());
	}

	@Test
	void validationErrorsReturn400() throws Exception {
		mvc.perform(post("/api/customers").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"\", \"phone\": \"11999990000\"}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/customers").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"Ana\", \"cpf\": \"123\", \"zipCode\": \"abc\", \"email\": \"invalido\"}"))
				.andExpect(status().isBadRequest());
	}

	private long readId(MvcResult result) throws Exception {
		JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
		return node.get("id").asLong();
	}

}
