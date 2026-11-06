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
class ProductionOrderFlowTests {

	@Autowired
	MockMvc mvc;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void productionOrderCrud() throws Exception {
		long breadId = createProduct("Pão de Queijo");
		long flourId = createProduct("Polvilho Azedo");
		long cheeseId = createProduct("Queijo Minas");
		long recipeId = createRecipe(breadId, flourId);

		String order = """
				{"recipeId": %d, "plannedQuantity": 100, "scheduledDate": "2026-11-07T08:00:00Z",
						"notes": "Produção da manhã",
						"consumptions": [{"productId": %d, "quantity": 10}, {"productId": %d, "quantity": 5}],
						"results": [{"productId": %d, "quantity": 98}]}
				""".formatted(recipeId, flourId, cheeseId, breadId);

		MvcResult created = mvc.perform(post("/api/production-orders").contentType(MediaType.APPLICATION_JSON)
						.content(order))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").exists())
				.andExpect(jsonPath("$.recipeId").value(recipeId))
				.andExpect(jsonPath("$.productId").value(breadId))
				.andExpect(jsonPath("$.productName").value("Pão de Queijo"))
				.andExpect(jsonPath("$.plannedQuantity").value(100))
				.andExpect(jsonPath("$.status").value("OPEN"))
				.andExpect(jsonPath("$.scheduledDate").value("2026-11-07T08:00:00Z"))
				.andExpect(jsonPath("$.consumptions.length()").value(2))
				.andExpect(jsonPath("$.consumptions[0].productId").value(flourId))
				.andExpect(jsonPath("$.results.length()").value(1))
				.andExpect(jsonPath("$.results[0].productName").value("Pão de Queijo"))
				.andExpect(jsonPath("$.producedQuantity").value(98))
				.andReturn();
		long id = readId(created);

		mvc.perform(get("/api/production-orders"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").exists());

		mvc.perform(get("/api/production-orders").param("search", "queijo"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").value(id));

		mvc.perform(get("/api/production-orders").param("status", "OPEN"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").value(id));

		mvc.perform(get("/api/production-orders").param("status", "COMPLETED"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(0));

		mvc.perform(get("/api/production-orders/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.notes").value("Produção da manhã"));

		String updated = """
				{"recipeId": %d, "plannedQuantity": 120, "status": "COMPLETED",
						"finishedAt": "2026-11-07T12:00:00Z",
						"results": [{"productId": %d, "quantity": 115}]}
				""".formatted(recipeId, breadId);
		mvc.perform(put("/api/production-orders/" + id).contentType(MediaType.APPLICATION_JSON)
						.content(updated))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.plannedQuantity").value(120))
				.andExpect(jsonPath("$.status").value("COMPLETED"))
				.andExpect(jsonPath("$.finishedAt").value("2026-11-07T12:00:00Z"))
				.andExpect(jsonPath("$.consumptions.length()").value(0))
				.andExpect(jsonPath("$.producedQuantity").value(115));

		mvc.perform(delete("/api/production-orders/" + id)).andExpect(status().isNoContent());

		mvc.perform(get("/api/production-orders/" + id)).andExpect(status().isNotFound());
	}

	@Test
	void validationErrorsReturn400() throws Exception {
		mvc.perform(post("/api/production-orders").contentType(MediaType.APPLICATION_JSON)
						.content("{}"))
				.andExpect(status().isBadRequest());

		long breadId = createProduct("Pão Caseiro");
		long flourId = createProduct("Farinha de Centeio");
		long recipeId = createRecipe(breadId, flourId);

		mvc.perform(post("/api/production-orders").contentType(MediaType.APPLICATION_JSON)
						.content("{\"recipeId\": 999999, \"plannedQuantity\": 10}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/production-orders").contentType(MediaType.APPLICATION_JSON)
						.content("{\"recipeId\": " + recipeId + ", \"plannedQuantity\": 0}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/production-orders").contentType(MediaType.APPLICATION_JSON)
						.content("{\"recipeId\": " + recipeId
								+ ", \"plannedQuantity\": 10, \"consumptions\": [{\"productId\": 999999, \"quantity\": 1}]}"))
				.andExpect(status().isBadRequest());

		String duplicatedConsumption = """
				{"recipeId": %d, "plannedQuantity": 10,
						"consumptions": [{"productId": %2$d, "quantity": 1}, {"productId": %2$d, "quantity": 2}]}
				""".formatted(recipeId, flourId);
		mvc.perform(post("/api/production-orders").contentType(MediaType.APPLICATION_JSON)
						.content(duplicatedConsumption))
				.andExpect(status().isBadRequest());

		String duplicatedResult = """
				{"recipeId": %d, "plannedQuantity": 10,
						"results": [{"productId": %2$d, "quantity": 5}, {"productId": %2$d, "quantity": 5}]}
				""".formatted(recipeId, breadId);
		mvc.perform(post("/api/production-orders").contentType(MediaType.APPLICATION_JSON)
						.content(duplicatedResult))
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

	private long readId(MvcResult result) throws Exception {
		JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
		return node.get("id").asLong();
	}

}
