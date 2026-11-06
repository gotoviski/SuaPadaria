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
class EmployeeFlowTests {

	@Autowired
	MockMvc mvc;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void employeeCrud() throws Exception {
		String employee = """
				{"name": "João Padeiro", "cpf": "12345678901", "phone": "+5511998877665",
				"email": "joao@padaria.com", "birthDate": "1990-05-10", "role": "Padeiro",
				"shift": "Manhã", "salary": 2500.00, "hireDate": "2024-01-15",
				"zipCode": "01234-567", "street": "Rua do Forno", "number": "100",
				"district": "Centro", "city": "São Paulo", "state": "SP",
				"notes": "Responsável pela fornada das 5h"}
				""";

		MvcResult created = mvc.perform(post("/api/employees").contentType(MediaType.APPLICATION_JSON).content(employee))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").exists())
				.andExpect(jsonPath("$.name").value("João Padeiro"))
				.andExpect(jsonPath("$.role").value("Padeiro"))
				.andExpect(jsonPath("$.active").value(true))
				.andReturn();
		long id = readId(created);

		mvc.perform(post("/api/employees").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"Outro Funcionário\", \"phone\": \"11999999999\", \"cpf\": \"12345678901\"}"))
				.andExpect(status().isConflict());

		mvc.perform(get("/api/employees"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").exists());

		mvc.perform(get("/api/employees").param("search", "padeiro"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].name").value("João Padeiro"));

		mvc.perform(get("/api/employees/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.cpf").value("12345678901"))
				.andExpect(jsonPath("$.city").value("São Paulo"));

		mvc.perform(put("/api/employees/" + id).contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"João Padeiro\", \"phone\": \"11999999999\", \"role\": \"Padeiro Chefe\", \"active\": false}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.role").value("Padeiro Chefe"))
				.andExpect(jsonPath("$.active").value(false))
				.andExpect(jsonPath("$.city").doesNotExist());

		mvc.perform(delete("/api/employees/" + id)).andExpect(status().isNoContent());

		mvc.perform(get("/api/employees/" + id)).andExpect(status().isNotFound());
	}

	@Test
	void validationErrorsReturn400() throws Exception {
		mvc.perform(post("/api/employees").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"\"}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/employees").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"Funcionário\", \"phone\": \"11999999999\", \"cpf\": \"123\", \"salary\": -10, \"email\": \"invalido\"}"))
				.andExpect(status().isBadRequest());
	}

	private long readId(MvcResult result) throws Exception {
		JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
		return node.get("id").asLong();
	}

}
