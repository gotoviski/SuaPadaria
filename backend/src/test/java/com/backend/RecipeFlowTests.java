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
class RecipeFlowTests {

	@Autowired
	MockMvc mvc;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void recipeCrud() throws Exception {
		long productId = createProduct("Pão Francês");
		long flourId = createProduct("Farinha de Trigo");
		long yeastId = createProduct("Fermento Biológico");

		String recipe = """
				{"productId": %d, "yieldQuantity": 50, "instructions": "Misturar, sovar e assar",
						"notes": "Forno a 200 graus",
						"ingredients": [{"productId": %d, "quantity": 10}, {"productId": %d, "quantity": 0.5}]}
				""".formatted(productId, flourId, yeastId);

		MvcResult created = mvc.perform(post("/api/recipes").contentType(MediaType.APPLICATION_JSON)
						.content(recipe))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").exists())
				.andExpect(jsonPath("$.productId").value(productId))
				.andExpect(jsonPath("$.productName").value("Pão Francês"))
				.andExpect(jsonPath("$.yieldQuantity").value(50))
				.andExpect(jsonPath("$.instructions").value("Misturar, sovar e assar"))
				.andExpect(jsonPath("$.active").value(true))
				.andExpect(jsonPath("$.ingredients.length()").value(2))
				.andExpect(jsonPath("$.ingredients[0].productId").value(flourId))
				.andExpect(jsonPath("$.ingredients[0].productName").value("Farinha de Trigo"))
				.andExpect(jsonPath("$.ingredients[0].quantity").value(10))
				.andReturn();
		long id = readId(created);

		mvc.perform(get("/api/recipes"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").exists());

		mvc.perform(get("/api/recipes").param("search", "francês"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].productName").value("Pão Francês"));

		mvc.perform(get("/api/recipes/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.notes").value("Forno a 200 graus"));

		String updated = """
				{"productId": %d, "yieldQuantity": 40, "active": false,
						"ingredients": [{"productId": %d, "quantity": 8}]}
				""".formatted(productId, flourId);
		mvc.perform(put("/api/recipes/" + id).contentType(MediaType.APPLICATION_JSON)
						.content(updated))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.yieldQuantity").value(40))
				.andExpect(jsonPath("$.active").value(false))
				.andExpect(jsonPath("$.notes").doesNotExist())
				.andExpect(jsonPath("$.ingredients.length()").value(1))
				.andExpect(jsonPath("$.ingredients[0].quantity").value(8));

		mvc.perform(delete("/api/recipes/" + id)).andExpect(status().isNoContent());

		mvc.perform(get("/api/recipes/" + id)).andExpect(status().isNotFound());
	}

	@Test
	void validationErrorsReturn400() throws Exception {
		mvc.perform(post("/api/recipes").contentType(MediaType.APPLICATION_JSON)
						.content("{}"))
				.andExpect(status().isBadRequest());

		long flourId = createProduct("Farinha Integral");

		mvc.perform(post("/api/recipes").contentType(MediaType.APPLICATION_JSON)
						.content("{\"productId\": 999999, \"yieldQuantity\": 10, \"ingredients\": [{\"productId\": "
								+ flourId + ", \"quantity\": 1}]}"))
				.andExpect(status().isBadRequest());

		long productId = createProduct("Bolo de Chocolate");

		mvc.perform(post("/api/recipes").contentType(MediaType.APPLICATION_JSON)
						.content("{\"productId\": " + productId + ", \"yieldQuantity\": 10, \"ingredients\": []}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/recipes").contentType(MediaType.APPLICATION_JSON)
						.content("{\"productId\": " + productId + ", \"yieldQuantity\": 0, \"ingredients\": [{\"productId\": "
								+ flourId + ", \"quantity\": 1}]}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/recipes").contentType(MediaType.APPLICATION_JSON)
						.content("{\"productId\": " + productId
								+ ", \"yieldQuantity\": 10, \"ingredients\": [{\"productId\": 999999, \"quantity\": 1}]}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/recipes").contentType(MediaType.APPLICATION_JSON)
						.content("{\"productId\": " + productId + ", \"yieldQuantity\": 10, \"ingredients\": [{\"productId\": "
								+ flourId + ", \"quantity\": 0}]}"))
				.andExpect(status().isBadRequest());

		String duplicated = """
				{"productId": %d, "yieldQuantity": 10,
						"ingredients": [{"productId": %2$d, "quantity": 1}, {"productId": %2$d, "quantity": 2}]}
				""".formatted(productId, flourId);
		mvc.perform(post("/api/recipes").contentType(MediaType.APPLICATION_JSON)
						.content(duplicated))
				.andExpect(status().isBadRequest());

		String selfIngredient = """
				{"productId": %d, "yieldQuantity": 10, "ingredients": [{"productId": %d, "quantity": 1}]}
				""".formatted(productId, productId);
		mvc.perform(post("/api/recipes").contentType(MediaType.APPLICATION_JSON)
						.content(selfIngredient))
				.andExpect(status().isBadRequest());
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
