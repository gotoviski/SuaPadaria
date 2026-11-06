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
class SaleFlowTests {

	@Autowired
	MockMvc mvc;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void saleCrud() throws Exception {
		long customerId = createCustomer("Maria Silva");
		long productId = createProduct("Pão Francês");
		long cashRegisterId = createCashRegister(null);

		String sale = """
				{"customerId": %d, "cashRegisterId": %d, "saleDate": "2026-11-06T10:00:00Z",
						"notes": "Venda balcão",
						"items": [{"productId": %d, "quantity": 10, "unitPrice": 0.80}],
						"payments": [{"method": "CASH", "amount": 5.00}, {"method": "PIX", "amount": 3.00}]}
				""".formatted(customerId, cashRegisterId, productId);

		MvcResult created = mvc.perform(post("/api/sales").contentType(MediaType.APPLICATION_JSON)
						.content(sale))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").exists())
				.andExpect(jsonPath("$.customerId").value(customerId))
				.andExpect(jsonPath("$.customerName").value("Maria Silva"))
				.andExpect(jsonPath("$.cashRegisterId").value(cashRegisterId))
				.andExpect(jsonPath("$.saleDate").value("2026-11-06T10:00:00Z"))
				.andExpect(jsonPath("$.items[0].productId").value(productId))
				.andExpect(jsonPath("$.items[0].productName").value("Pão Francês"))
				.andExpect(jsonPath("$.items[0].quantity").value(10))
				.andExpect(jsonPath("$.items[0].unitPrice").value(0.80))
				.andExpect(jsonPath("$.items[0].totalPrice").value(8.00))
				.andExpect(jsonPath("$.payments[0].method").value("CASH"))
				.andExpect(jsonPath("$.payments[1].method").value("PIX"))
				.andExpect(jsonPath("$.total").value(8.00))
				.andExpect(jsonPath("$.paidTotal").value(8.00))
				.andReturn();
		long id = readId(created);

		mvc.perform(get("/api/sales"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").exists());

		mvc.perform(get("/api/sales").param("search", "maria"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].customerName").value("Maria Silva"));

		mvc.perform(get("/api/sales/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.notes").value("Venda balcão"));

		String updated = """
				{"customerId": %d, "items": [{"productId": %d, "quantity": 5, "unitPrice": 1.00}],
						"payments": [{"method": "DEBIT_CARD", "amount": 5.00}]}
				""".formatted(customerId, productId);
		mvc.perform(put("/api/sales/" + id).contentType(MediaType.APPLICATION_JSON)
						.content(updated))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.notes").doesNotExist())
				.andExpect(jsonPath("$.items.length()").value(1))
				.andExpect(jsonPath("$.items[0].quantity").value(5))
				.andExpect(jsonPath("$.payments.length()").value(1))
				.andExpect(jsonPath("$.payments[0].method").value("DEBIT_CARD"))
				.andExpect(jsonPath("$.total").value(5.00))
				.andExpect(jsonPath("$.paidTotal").value(5.00));

		mvc.perform(delete("/api/sales/" + id)).andExpect(status().isNoContent());

		mvc.perform(get("/api/sales/" + id)).andExpect(status().isNotFound());
	}

	@Test
	void saleWithoutCustomer() throws Exception {
		long productId = createProduct("Bolo de Cenoura");

		String sale = """
				{"saleDate": "2026-11-06T11:00:00Z",
						"items": [{"productId": %d, "quantity": 1, "unitPrice": 15.00}],
						"payments": [{"method": "CREDIT_CARD", "amount": 15.00}]}
				""".formatted(productId);

		mvc.perform(post("/api/sales").contentType(MediaType.APPLICATION_JSON)
						.content(sale))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.customerId").doesNotExist())
				.andExpect(jsonPath("$.total").value(15.00));
	}

	@Test
	void validationErrorsReturn400() throws Exception {
		mvc.perform(post("/api/sales").contentType(MediaType.APPLICATION_JSON)
						.content("{}"))
				.andExpect(status().isBadRequest());

		long productId = createProduct("Sonho");

		mvc.perform(post("/api/sales").contentType(MediaType.APPLICATION_JSON)
						.content("{\"customerId\": 999999, \"items\": [{\"productId\": " + productId
								+ ", \"quantity\": 1, \"unitPrice\": 1.00}]}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/sales").contentType(MediaType.APPLICATION_JSON)
						.content("{\"cashRegisterId\": 999999, \"items\": [{\"productId\": " + productId
								+ ", \"quantity\": 1, \"unitPrice\": 1.00}]}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/sales").contentType(MediaType.APPLICATION_JSON)
						.content("{\"items\": []}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/sales").contentType(MediaType.APPLICATION_JSON)
						.content("{\"items\": [{\"productId\": 999999, \"quantity\": 1, \"unitPrice\": 1.00}]}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/sales").contentType(MediaType.APPLICATION_JSON)
						.content("{\"items\": [{\"productId\": " + productId
								+ ", \"quantity\": 0, \"unitPrice\": 1.00}]}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/sales").contentType(MediaType.APPLICATION_JSON)
						.content("{\"items\": [{\"productId\": " + productId
								+ ", \"quantity\": 1, \"unitPrice\": 1.00}], \"payments\": [{\"amount\": 1.00}]}"))
				.andExpect(status().isBadRequest());

		String duplicated = """
				{"items": [{"productId": %1$d, "quantity": 1, "unitPrice": 1.00},
						{"productId": %1$d, "quantity": 2, "unitPrice": 2.00}]}
				""".formatted(productId);
		mvc.perform(post("/api/sales").contentType(MediaType.APPLICATION_JSON)
						.content(duplicated))
				.andExpect(status().isBadRequest());
	}

	@Test
	void saleOnClosedCashRegisterReturns400() throws Exception {
		long closedRegisterId = createCashRegister("2026-11-06T18:00:00Z");
		long productId = createProduct("Coxinha");

		String sale = """
				{"cashRegisterId": %d,
						"items": [{"productId": %d, "quantity": 1, "unitPrice": 5.00}]}
				""".formatted(closedRegisterId, productId);

		mvc.perform(post("/api/sales").contentType(MediaType.APPLICATION_JSON)
						.content(sale))
				.andExpect(status().isBadRequest());
	}

	private long createCustomer(String name) throws Exception {
		MvcResult result = mvc.perform(post("/api/customers").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"%s\", \"phone\": \"11999990000\"}".formatted(name)))
				.andExpect(status().isCreated())
				.andReturn();
		return readId(result);
	}

	private long createProduct(String name) throws Exception {
		MvcResult result = mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"%s\", \"price\": 5.50}".formatted(name)))
				.andExpect(status().isCreated())
				.andReturn();
		return readId(result);
	}

	private long createCashRegister(String closedAt) throws Exception {
		String body = closedAt == null
				? "{\"openedAt\": \"2026-11-06T08:00:00Z\", \"openingAmount\": 100.00}"
				: "{\"openedAt\": \"2026-11-06T08:00:00Z\", \"openingAmount\": 100.00, \"closedAt\": \""
						+ closedAt + "\", \"closingAmount\": 300.00}";
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
