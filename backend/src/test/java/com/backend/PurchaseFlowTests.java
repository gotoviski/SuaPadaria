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
class PurchaseFlowTests {

	@Autowired
	MockMvc mvc;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void purchaseCrud() throws Exception {
		long supplierId = createSupplier("Moinho Norte");
		long productId = createProduct("Farinha de Trigo");

		String purchase = """
				{"supplierId": %d, "purchaseDate": "2026-11-06T10:00:00Z", "notes": "Compra semanal",
						"items": [{"productId": %d, "quantity": 25.5, "unitPrice": 4.50}]}
				""".formatted(supplierId, productId);

		MvcResult created = mvc.perform(post("/api/purchases").contentType(MediaType.APPLICATION_JSON)
						.content(purchase))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").exists())
				.andExpect(jsonPath("$.supplierId").value(supplierId))
				.andExpect(jsonPath("$.supplierName").value("Moinho Norte"))
				.andExpect(jsonPath("$.purchaseDate").value("2026-11-06T10:00:00Z"))
				.andExpect(jsonPath("$.items[0].productId").value(productId))
				.andExpect(jsonPath("$.items[0].productName").value("Farinha de Trigo"))
				.andExpect(jsonPath("$.items[0].quantity").value(25.5))
				.andExpect(jsonPath("$.items[0].unitPrice").value(4.50))
				.andExpect(jsonPath("$.items[0].totalPrice").value(114.75))
				.andExpect(jsonPath("$.total").value(114.75))
				.andReturn();
		long id = readId(created);

		mvc.perform(get("/api/purchases"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").exists());

		mvc.perform(get("/api/purchases").param("search", "moinho"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].supplierName").value("Moinho Norte"));

		mvc.perform(get("/api/purchases/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.notes").value("Compra semanal"));

		String updated = """
				{"supplierId": %d, "items": [{"productId": %d, "quantity": 10, "unitPrice": 5.00}]}
				""".formatted(supplierId, productId);
		mvc.perform(put("/api/purchases/" + id).contentType(MediaType.APPLICATION_JSON)
						.content(updated))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.notes").doesNotExist())
				.andExpect(jsonPath("$.items[0].quantity").value(10))
				.andExpect(jsonPath("$.items.length()").value(1))
				.andExpect(jsonPath("$.total").value(50.00));

		mvc.perform(delete("/api/purchases/" + id)).andExpect(status().isNoContent());

		mvc.perform(get("/api/purchases/" + id)).andExpect(status().isNotFound());
	}

	@Test
	void validationErrorsReturn400() throws Exception {
		mvc.perform(post("/api/purchases").contentType(MediaType.APPLICATION_JSON)
						.content("{}"))
				.andExpect(status().isBadRequest());

		long productId = createProduct("Açúcar Refinado");

		mvc.perform(post("/api/purchases").contentType(MediaType.APPLICATION_JSON)
						.content("{\"supplierId\": 999999, \"items\": [{\"productId\": " + productId
								+ ", \"quantity\": 1, \"unitPrice\": 1.00}]}"))
				.andExpect(status().isBadRequest());

		long supplierId = createSupplier("Laticínios Sul");

		mvc.perform(post("/api/purchases").contentType(MediaType.APPLICATION_JSON)
						.content("{\"supplierId\": " + supplierId + ", \"items\": []}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/purchases").contentType(MediaType.APPLICATION_JSON)
						.content("{\"supplierId\": " + supplierId
								+ ", \"items\": [{\"productId\": 999999, \"quantity\": 1, \"unitPrice\": 1.00}]}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/purchases").contentType(MediaType.APPLICATION_JSON)
						.content("{\"supplierId\": " + supplierId + ", \"items\": [{\"productId\": " + productId
								+ ", \"quantity\": 0, \"unitPrice\": 1.00}]}"))
				.andExpect(status().isBadRequest());

		String duplicated = """
				{"supplierId": %d, "items": [{"productId": %2$d, "quantity": 1, "unitPrice": 1.00},
						{"productId": %2$d, "quantity": 2, "unitPrice": 2.00}]}
				""".formatted(supplierId, productId);
		mvc.perform(post("/api/purchases").contentType(MediaType.APPLICATION_JSON)
						.content(duplicated))
				.andExpect(status().isBadRequest());
	}

	private long createSupplier(String name) throws Exception {
		MvcResult result = mvc.perform(post("/api/suppliers").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"%s\"}".formatted(name)))
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

	private long readId(MvcResult result) throws Exception {
		JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
		return node.get("id").asLong();
	}

}
