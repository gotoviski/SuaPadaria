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
class ProductPriceFlowTests {

	@Autowired
	MockMvc mvc;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void productPriceCrud() throws Exception {
		long productId = createProduct("Bolo de Cenoura");
		long tableId = createPriceTable("Tabela Varejo");

		String price = """
				{"priceTableId": %d, "productId": %d, "price": 12.90}
				""".formatted(tableId, productId);

		MvcResult created = mvc.perform(post("/api/product-prices").contentType(MediaType.APPLICATION_JSON)
						.content(price))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").exists())
				.andExpect(jsonPath("$.priceTableId").value(tableId))
				.andExpect(jsonPath("$.priceTableName").value("Tabela Varejo"))
				.andExpect(jsonPath("$.productId").value(productId))
				.andExpect(jsonPath("$.productName").value("Bolo de Cenoura"))
				.andExpect(jsonPath("$.price").value(12.90))
				.andReturn();
		long id = readId(created);

		mvc.perform(post("/api/product-prices").contentType(MediaType.APPLICATION_JSON)
						.content(price))
				.andExpect(status().isConflict());

		mvc.perform(get("/api/product-prices").param("priceTableId", String.valueOf(tableId)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").value(id));

		mvc.perform(get("/api/product-prices").param("productId", String.valueOf(productId)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").value(id));

		mvc.perform(get("/api/product-prices").param("search", "cenoura"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").value(id));

		mvc.perform(get("/api/product-prices/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.price").value(12.90));

		String updated = """
				{"priceTableId": %d, "productId": %d, "price": 10.50}
				""".formatted(tableId, productId);
		mvc.perform(put("/api/product-prices/" + id).contentType(MediaType.APPLICATION_JSON)
						.content(updated))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.price").value(10.50));

		mvc.perform(delete("/api/product-prices/" + id)).andExpect(status().isNoContent());

		mvc.perform(get("/api/product-prices/" + id)).andExpect(status().isNotFound());
	}

	@Test
	void updateToExistingPairReturns409() throws Exception {
		long productA = createProduct("Sonho");
		long productB = createProduct("Brigadeiro");
		long tableId = createPriceTable("Tabela Atacado");

		mvc.perform(post("/api/product-prices").contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"priceTableId": %d, "productId": %d, "price": 2.00}
								""".formatted(tableId, productA)))
				.andExpect(status().isCreated());

		MvcResult second = mvc.perform(post("/api/product-prices").contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"priceTableId": %d, "productId": %d, "price": 3.00}
								""".formatted(tableId, productB)))
				.andExpect(status().isCreated())
				.andReturn();
		long id = readId(second);

		mvc.perform(put("/api/product-prices/" + id).contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"priceTableId": %d, "productId": %d, "price": 3.00}
								""".formatted(tableId, productA)))
				.andExpect(status().isConflict());
	}

	@Test
	void validationErrorsReturn400() throws Exception {
		mvc.perform(post("/api/product-prices").contentType(MediaType.APPLICATION_JSON)
						.content("{\"productId\": 1, \"price\": 1.00}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/product-prices").contentType(MediaType.APPLICATION_JSON)
						.content("{\"priceTableId\": 999999, \"productId\": 1, \"price\": 1.00}"))
				.andExpect(status().isBadRequest());

		long tableId = createPriceTable("Tabela Promoção");
		mvc.perform(post("/api/product-prices").contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"priceTableId": %d, "productId": 999999, "price": 1.00}
								""".formatted(tableId)))
				.andExpect(status().isBadRequest());

		long productId = createProduct("Pão Francês");
		mvc.perform(post("/api/product-prices").contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"priceTableId": %d, "productId": %d, "price": -1.00}
								""".formatted(tableId, productId)))
				.andExpect(status().isBadRequest());
	}

	private long createProduct(String name) throws Exception {
		MvcResult result = mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"%s\", \"price\": 5.50}".formatted(name)))
				.andExpect(status().isCreated())
				.andReturn();
		return readId(result);
	}

	private long createPriceTable(String name) throws Exception {
		MvcResult result = mvc.perform(post("/api/price-tables").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"%s\"}".formatted(name)))
				.andExpect(status().isCreated())
				.andReturn();
		return readId(result);
	}

	private long readId(MvcResult result) throws Exception {
		JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
		return node.get("id").asLong();
	}

}
