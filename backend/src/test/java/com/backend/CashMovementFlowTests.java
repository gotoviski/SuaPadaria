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
class CashMovementFlowTests {

	@Autowired
	MockMvc mvc;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void cashMovementCrud() throws Exception {
		long cashRegisterId = createCashRegister(false);

		String movement = """
				{"cashRegisterId": %d, "type": "ENTRY", "amount": 50.00,
						"description": "Suprimento", "movementDate": "2026-11-06T09:00:00Z"}
				""".formatted(cashRegisterId);

		MvcResult created = mvc.perform(post("/api/cash-movements").contentType(MediaType.APPLICATION_JSON)
						.content(movement))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").exists())
				.andExpect(jsonPath("$.cashRegisterId").value(cashRegisterId))
				.andExpect(jsonPath("$.type").value("ENTRY"))
				.andExpect(jsonPath("$.amount").value(50.00))
				.andExpect(jsonPath("$.description").value("Suprimento"))
				.andExpect(jsonPath("$.movementDate").value("2026-11-06T09:00:00Z"))
				.andReturn();
		long id = readId(created);

		mvc.perform(get("/api/cash-movements"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").exists());

		mvc.perform(get("/api/cash-movements").param("cashRegisterId", String.valueOf(cashRegisterId)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].cashRegisterId").value(cashRegisterId));

		mvc.perform(get("/api/cash-movements/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.description").value("Suprimento"));

		String updated = """
				{"cashRegisterId": %d, "type": "EXIT", "amount": 30.00, "description": "Sangria"}
				""".formatted(cashRegisterId);
		mvc.perform(put("/api/cash-movements/" + id).contentType(MediaType.APPLICATION_JSON)
						.content(updated))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.type").value("EXIT"))
				.andExpect(jsonPath("$.amount").value(30.00))
				.andExpect(jsonPath("$.description").value("Sangria"));

		mvc.perform(delete("/api/cash-movements/" + id)).andExpect(status().isNoContent());

		mvc.perform(get("/api/cash-movements/" + id)).andExpect(status().isNotFound());
	}

	@Test
	void movementOnClosedCashRegisterReturns400() throws Exception {
		long cashRegisterId = createCashRegister(true);

		String movement = """
				{"cashRegisterId": %d, "type": "ENTRY", "amount": 50.00}
				""".formatted(cashRegisterId);

		mvc.perform(post("/api/cash-movements").contentType(MediaType.APPLICATION_JSON)
						.content(movement))
				.andExpect(status().isBadRequest());
	}

	@Test
	void validationErrorsReturn400() throws Exception {
		mvc.perform(post("/api/cash-movements").contentType(MediaType.APPLICATION_JSON)
						.content("{}"))
				.andExpect(status().isBadRequest());

		long cashRegisterId = createCashRegister(false);

		mvc.perform(post("/api/cash-movements").contentType(MediaType.APPLICATION_JSON)
						.content("{\"cashRegisterId\": 999999, \"type\": \"ENTRY\", \"amount\": 10.00}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/cash-movements").contentType(MediaType.APPLICATION_JSON)
						.content("{\"cashRegisterId\": " + cashRegisterId + ", \"amount\": 10.00}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/cash-movements").contentType(MediaType.APPLICATION_JSON)
						.content("{\"cashRegisterId\": " + cashRegisterId
								+ ", \"type\": \"ENTRY\", \"amount\": 0}"))
				.andExpect(status().isBadRequest());
	}

	private long createCashRegister(boolean closed) throws Exception {
		String body = closed
				? "{\"openedAt\": \"2026-11-06T08:00:00Z\", \"openingAmount\": 100.00, "
						+ "\"closedAt\": \"2026-11-06T18:00:00Z\", \"closingAmount\": 300.00}"
				: "{\"openedAt\": \"2026-11-06T08:00:00Z\", \"openingAmount\": 100.00}";
		MvcResult result = mvc.perform(post("/api/cash-registers").contentType(MediaType.APPLICATION_JSON)
						.content(body))
				.andExpect(status().isCreated())
				.andReturn();
		return readId(result);
	}

	private long readId(MvcResult result) throws Exception {
		JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
		return node.get("id").asLong();
	}

}
