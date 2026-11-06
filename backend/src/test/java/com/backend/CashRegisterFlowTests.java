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
class CashRegisterFlowTests {

	@Autowired
	MockMvc mvc;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void cashRegisterCrud() throws Exception {
		long employeeId = createEmployee("João Caixa");

		String cashRegister = """
				{"employeeId": %d, "openedAt": "2026-11-06T08:00:00Z", "openingAmount": 150.00,
						"notes": "Turno manhã"}
				""".formatted(employeeId);

		MvcResult created = mvc.perform(post("/api/cash-registers").contentType(MediaType.APPLICATION_JSON)
						.content(cashRegister))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").exists())
				.andExpect(jsonPath("$.employeeId").value(employeeId))
				.andExpect(jsonPath("$.employeeName").value("João Caixa"))
				.andExpect(jsonPath("$.openedAt").value("2026-11-06T08:00:00Z"))
				.andExpect(jsonPath("$.openingAmount").value(150.00))
				.andExpect(jsonPath("$.status").value("OPEN"))
				.andExpect(jsonPath("$.closedAt").doesNotExist())
				.andReturn();
		long id = readId(created);

		mvc.perform(get("/api/cash-registers"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").exists());

		mvc.perform(get("/api/cash-registers").param("search", "joão"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].employeeName").value("João Caixa"));

		mvc.perform(get("/api/cash-registers/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.notes").value("Turno manhã"));

		String closed = """
				{"employeeId": %d, "openedAt": "2026-11-06T08:00:00Z", "openingAmount": 150.00,
						"closedAt": "2026-11-06T18:00:00Z", "closingAmount": 480.00}
				""".formatted(employeeId);
		mvc.perform(put("/api/cash-registers/" + id).contentType(MediaType.APPLICATION_JSON)
						.content(closed))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("CLOSED"))
				.andExpect(jsonPath("$.closedAt").value("2026-11-06T18:00:00Z"))
				.andExpect(jsonPath("$.closingAmount").value(480.00));

		mvc.perform(delete("/api/cash-registers/" + id)).andExpect(status().isNoContent());

		mvc.perform(get("/api/cash-registers/" + id)).andExpect(status().isNotFound());
	}

	@Test
	void validationErrorsReturn400() throws Exception {
		mvc.perform(post("/api/cash-registers").contentType(MediaType.APPLICATION_JSON)
						.content("{\"employeeId\": 999999}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/cash-registers").contentType(MediaType.APPLICATION_JSON)
						.content("{\"openingAmount\": -10.00}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/cash-registers").contentType(MediaType.APPLICATION_JSON)
						.content("{\"openedAt\": \"2026-11-06T18:00:00Z\", "
								+ "\"closedAt\": \"2026-11-06T08:00:00Z\"}"))
				.andExpect(status().isBadRequest());
	}

	private long createEmployee(String name) throws Exception {
		MvcResult result = mvc.perform(post("/api/employees").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"%s\", \"phone\": \"11988880000\"}".formatted(name)))
				.andExpect(status().isCreated())
				.andReturn();
		return readId(result);
	}

	private long readId(MvcResult result) throws Exception {
		JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
		return node.get("id").asLong();
	}

}
