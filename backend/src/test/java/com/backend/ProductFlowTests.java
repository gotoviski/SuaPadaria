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
class ProductFlowTests {

	@Autowired
	MockMvc mvc;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void productCrud() throws Exception {
		String product = """
				{"name": "Pão Francês", "description": "Pão tradicional de fermentação natural",
				"category": "Pães", "unit": "un", "price": 0.80, "sku": "PAO-001",
				"notes": "Fornadas às 6h e 15h"}
				""";

		MvcResult created = mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON).content(product))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").exists())
				.andExpect(jsonPath("$.name").value("Pão Francês"))
				.andExpect(jsonPath("$.active").value(true))
				.andReturn();
		long id = readId(created);

		mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"Bolo de Chocolate\", \"sku\": \"PAO-001\"}"))
				.andExpect(status().isConflict());

		mvc.perform(get("/api/products"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").exists());

		mvc.perform(get("/api/products").param("search", "pães"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].name").value("Pão Francês"));

		mvc.perform(get("/api/products/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.sku").value("PAO-001"))
				.andExpect(jsonPath("$.price").value(0.80));

		mvc.perform(put("/api/products/" + id).contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"Pão Francês Integral\", \"active\": false}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value("Pão Francês Integral"))
				.andExpect(jsonPath("$.active").value(false))
				.andExpect(jsonPath("$.category").doesNotExist());

		mvc.perform(delete("/api/products/" + id)).andExpect(status().isNoContent());

		mvc.perform(get("/api/products/" + id)).andExpect(status().isNotFound());
	}

	@Test
	void validationErrorsReturn400() throws Exception {
		mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"\"}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"Refrigerante\", \"price\": -1.50}"))
				.andExpect(status().isBadRequest());
	}

	private long readId(MvcResult result) throws Exception {
		JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
		return node.get("id").asLong();
	}

}
