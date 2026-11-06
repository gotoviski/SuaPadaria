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
class SalePaymentFlowTests {

	@Autowired
	MockMvc mvc;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void salePaymentCrud() throws Exception {
		long saleId = createSale();

		String payment = """
				{"saleId": %d, "method": "CASH", "amount": 20.00}
				""".formatted(saleId);

		MvcResult created = mvc.perform(post("/api/sale-payments").contentType(MediaType.APPLICATION_JSON)
						.content(payment))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").exists())
				.andExpect(jsonPath("$.saleId").value(saleId))
				.andExpect(jsonPath("$.method").value("CASH"))
				.andExpect(jsonPath("$.amount").value(20.00))
				.andReturn();
		long id = readId(created);

		mvc.perform(get("/api/sale-payments"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").exists());

		mvc.perform(get("/api/sale-payments").param("saleId", String.valueOf(saleId)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].saleId").value(saleId));

		mvc.perform(get("/api/sale-payments/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.method").value("CASH"));

		String updated = """
				{"saleId": %d, "method": "PIX", "amount": 25.00}
				""".formatted(saleId);
		mvc.perform(put("/api/sale-payments/" + id).contentType(MediaType.APPLICATION_JSON)
						.content(updated))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.method").value("PIX"))
				.andExpect(jsonPath("$.amount").value(25.00));

		mvc.perform(delete("/api/sale-payments/" + id)).andExpect(status().isNoContent());

		mvc.perform(get("/api/sale-payments/" + id)).andExpect(status().isNotFound());
	}

	@Test
	void validationErrorsReturn400() throws Exception {
		mvc.perform(post("/api/sale-payments").contentType(MediaType.APPLICATION_JSON)
						.content("{}"))
				.andExpect(status().isBadRequest());

		long saleId = createSale();

		mvc.perform(post("/api/sale-payments").contentType(MediaType.APPLICATION_JSON)
						.content("{\"method\": \"CASH\", \"amount\": 10.00}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/sale-payments").contentType(MediaType.APPLICATION_JSON)
						.content("{\"saleId\": 999999, \"method\": \"CASH\", \"amount\": 10.00}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/sale-payments").contentType(MediaType.APPLICATION_JSON)
						.content("{\"saleId\": " + saleId + ", \"amount\": 10.00}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/sale-payments").contentType(MediaType.APPLICATION_JSON)
						.content("{\"saleId\": " + saleId + ", \"method\": \"CASH\", \"amount\": 0}"))
				.andExpect(status().isBadRequest());
	}

	private long createSale() throws Exception {
		MvcResult product = mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"Baguete\", \"price\": 7.00}"))
				.andExpect(status().isCreated())
				.andReturn();
		long productId = readId(product);

		String sale = """
				{"saleDate": "2026-11-06T10:00:00Z",
						"items": [{"productId": %d, "quantity": 2, "unitPrice": 7.00}]}
				""".formatted(productId);
		MvcResult result = mvc.perform(post("/api/sales").contentType(MediaType.APPLICATION_JSON)
						.content(sale))
				.andExpect(status().isCreated())
				.andReturn();
		return readId(result);
	}

	private long readId(MvcResult result) throws Exception {
		JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
		return node.get("id").asLong();
	}

}
