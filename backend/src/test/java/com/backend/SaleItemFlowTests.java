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
class SaleItemFlowTests {

	@Autowired
	MockMvc mvc;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void saleItemCrud() throws Exception {
		long productId = createProduct("Pão de Queijo");
		long saleId = createSale();

		String item = """
				{"saleId": %d, "productId": %d, "quantity": 6, "unitPrice": 3.50}
				""".formatted(saleId, productId);

		MvcResult created = mvc.perform(post("/api/sale-items").contentType(MediaType.APPLICATION_JSON)
						.content(item))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").exists())
				.andExpect(jsonPath("$.saleId").value(saleId))
				.andExpect(jsonPath("$.productId").value(productId))
				.andExpect(jsonPath("$.productName").value("Pão de Queijo"))
				.andExpect(jsonPath("$.quantity").value(6))
				.andExpect(jsonPath("$.unitPrice").value(3.50))
				.andExpect(jsonPath("$.totalPrice").value(21.00))
				.andReturn();
		long id = readId(created);

		mvc.perform(get("/api/sale-items"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").exists());

		mvc.perform(get("/api/sale-items").param("saleId", String.valueOf(saleId)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].saleId").value(saleId));

		mvc.perform(get("/api/sale-items").param("productId", String.valueOf(productId)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].productName").value("Pão de Queijo"));

		mvc.perform(get("/api/sale-items").param("search", "queijo"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].productName").value("Pão de Queijo"));

		mvc.perform(get("/api/sale-items/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.quantity").value(6));

		String updated = """
				{"saleId": %d, "productId": %d, "quantity": 3, "unitPrice": 4.00}
				""".formatted(saleId, productId);
		mvc.perform(put("/api/sale-items/" + id).contentType(MediaType.APPLICATION_JSON)
						.content(updated))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.quantity").value(3))
				.andExpect(jsonPath("$.totalPrice").value(12.00));

		mvc.perform(delete("/api/sale-items/" + id)).andExpect(status().isNoContent());

		mvc.perform(get("/api/sale-items/" + id)).andExpect(status().isNotFound());
	}

	@Test
	void duplicateProductReturns409() throws Exception {
		long productId = createProduct("Empada");
		long saleId = createSale(productId);

		String item = """
				{"saleId": %d, "productId": %d, "quantity": 1, "unitPrice": 6.00}
				""".formatted(saleId, productId);

		mvc.perform(post("/api/sale-items").contentType(MediaType.APPLICATION_JSON)
						.content(item))
				.andExpect(status().isConflict());
	}

	@Test
	void validationErrorsReturn400() throws Exception {
		mvc.perform(post("/api/sale-items").contentType(MediaType.APPLICATION_JSON)
						.content("{}"))
				.andExpect(status().isBadRequest());

		long productId = createProduct("Pastel");

		mvc.perform(post("/api/sale-items").contentType(MediaType.APPLICATION_JSON)
						.content("{\"productId\": " + productId + ", \"quantity\": 1, \"unitPrice\": 1.00}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/sale-items").contentType(MediaType.APPLICATION_JSON)
						.content("{\"saleId\": 999999, \"productId\": " + productId
								+ ", \"quantity\": 1, \"unitPrice\": 1.00}"))
				.andExpect(status().isBadRequest());

		long saleId = createSale();

		mvc.perform(post("/api/sale-items").contentType(MediaType.APPLICATION_JSON)
						.content("{\"saleId\": " + saleId
								+ ", \"productId\": 999999, \"quantity\": 1, \"unitPrice\": 1.00}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/sale-items").contentType(MediaType.APPLICATION_JSON)
						.content("{\"saleId\": " + saleId + ", \"productId\": " + productId
								+ ", \"quantity\": 0, \"unitPrice\": 1.00}"))
				.andExpect(status().isBadRequest());
	}

	private long createProduct(String name) throws Exception {
		MvcResult result = mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"%s\", \"price\": 5.50}".formatted(name)))
				.andExpect(status().isCreated())
				.andReturn();
		return readId(result);
	}

	private long createSale() throws Exception {
		return createSale(createProduct("Rosca"));
	}

	private long createSale(long productId) throws Exception {
		String sale = """
				{"saleDate": "2026-11-06T10:00:00Z",
						"items": [{"productId": %d, "quantity": 1, "unitPrice": 5.50}]}
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
