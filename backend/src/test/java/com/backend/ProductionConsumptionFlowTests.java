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
class ProductionConsumptionFlowTests {

	@Autowired
	MockMvc mvc;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void productionConsumptionCrud() throws Exception {
		long breadId = createProduct("Pão Australiano");
		long flourId = createProduct("Farinha de Malte");
		long oilId = createProduct("Óleo de Canola");
		long recipeId = createRecipe(breadId, flourId);
		long orderId = createProductionOrder(recipeId, flourId);

		String consumption = """
				{"orderId": %d, "productId": %d, "quantity": 2.5}
				""".formatted(orderId, oilId);

		MvcResult created = mvc.perform(post("/api/production-consumptions").contentType(MediaType.APPLICATION_JSON)
						.content(consumption))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").exists())
				.andExpect(jsonPath("$.orderId").value(orderId))
				.andExpect(jsonPath("$.orderProductName").value("Pão Australiano"))
				.andExpect(jsonPath("$.productId").value(oilId))
				.andExpect(jsonPath("$.productName").value("Óleo de Canola"))
				.andExpect(jsonPath("$.quantity").value(2.5))
				.andReturn();
		long id = readId(created);

		mvc.perform(post("/api/production-consumptions").contentType(MediaType.APPLICATION_JSON)
						.content(consumption))
				.andExpect(status().isConflict());

		mvc.perform(get("/api/production-consumptions").param("orderId", String.valueOf(orderId)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(2));

		mvc.perform(get("/api/production-consumptions").param("productId", String.valueOf(oilId)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").value(id));

		mvc.perform(get("/api/production-consumptions").param("search", "canola"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").value(id));

		mvc.perform(get("/api/production-consumptions/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.quantity").value(2.5));

		String updated = """
				{"orderId": %d, "productId": %d, "quantity": 3}
				""".formatted(orderId, oilId);
		mvc.perform(put("/api/production-consumptions/" + id).contentType(MediaType.APPLICATION_JSON)
						.content(updated))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.quantity").value(3));

		mvc.perform(delete("/api/production-consumptions/" + id)).andExpect(status().isNoContent());

		mvc.perform(get("/api/production-consumptions/" + id)).andExpect(status().isNotFound());
	}

	@Test
	void validationErrorsReturn400() throws Exception {
		long breadId = createProduct("Pão Ciabatta");
		long flourId = createProduct("Farinha Tipo 1");
		long recipeId = createRecipe(breadId, flourId);
		long orderId = createProductionOrder(recipeId, flourId);

		mvc.perform(post("/api/production-consumptions").contentType(MediaType.APPLICATION_JSON)
						.content("{}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/production-consumptions").contentType(MediaType.APPLICATION_JSON)
						.content("{\"productId\": " + flourId + ", \"quantity\": 1}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/production-consumptions").contentType(MediaType.APPLICATION_JSON)
						.content("{\"orderId\": 999999, \"productId\": " + flourId + ", \"quantity\": 1}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/production-consumptions").contentType(MediaType.APPLICATION_JSON)
						.content("{\"orderId\": " + orderId + ", \"productId\": 999999, \"quantity\": 1}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/production-consumptions").contentType(MediaType.APPLICATION_JSON)
						.content("{\"orderId\": " + orderId + ", \"productId\": " + flourId + ", \"quantity\": 0}"))
				.andExpect(status().isBadRequest());
	}

	private long createProduct(String name) throws Exception {
		MvcResult result = mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"%s\", \"price\": 5.50}".formatted(name)))
				.andExpect(status().isCreated())
				.andReturn();
		return readId(result);
	}

	private long createRecipe(long productId, long ingredientProductId) throws Exception {
		String recipe = """
				{"productId": %d, "yieldQuantity": 10, "ingredients": [{"productId": %d, "quantity": 5}]}
				""".formatted(productId, ingredientProductId);
		MvcResult result = mvc.perform(post("/api/recipes").contentType(MediaType.APPLICATION_JSON)
						.content(recipe))
				.andExpect(status().isCreated())
				.andReturn();
		return readId(result);
	}

	private long createProductionOrder(long recipeId, long ingredientProductId) throws Exception {
		String order = """
				{"recipeId": %d, "plannedQuantity": 10,
						"consumptions": [{"productId": %d, "quantity": 5}]}
				""".formatted(recipeId, ingredientProductId);
		MvcResult result = mvc.perform(post("/api/production-orders").contentType(MediaType.APPLICATION_JSON)
						.content(order))
				.andExpect(status().isCreated())
				.andReturn();
		return readId(result);
	}

	private long readId(MvcResult result) throws Exception {
		JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
		return node.get("id").asLong();
	}

}
