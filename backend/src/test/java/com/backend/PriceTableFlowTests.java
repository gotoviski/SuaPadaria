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
class PriceTableFlowTests {

	@Autowired
	MockMvc mvc;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void priceTableCrud() throws Exception {
		long productId = createProduct("Pão de Queijo");

		String table = """
				{"name": "Atacado", "description": "Preços para revenda", "items": [{"productId": %d, "price": 4.50}]}
				""".formatted(productId);

		MvcResult created = mvc.perform(post("/api/price-tables").contentType(MediaType.APPLICATION_JSON)
						.content(table))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").exists())
				.andExpect(jsonPath("$.name").value("Atacado"))
				.andExpect(jsonPath("$.active").value(true))
				.andExpect(jsonPath("$.items[0].productId").value(productId))
				.andExpect(jsonPath("$.items[0].productName").value("Pão de Queijo"))
				.andExpect(jsonPath("$.items[0].price").value(4.50))
				.andReturn();
		long id = readId(created);

		mvc.perform(post("/api/price-tables").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"Atacado\"}"))
				.andExpect(status().isConflict());

		mvc.perform(get("/api/price-tables"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").exists());

		mvc.perform(get("/api/price-tables").param("search", "atacado"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].name").value("Atacado"));

		mvc.perform(get("/api/price-tables/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.description").value("Preços para revenda"));

		String updated = """
				{"name": "Atacado VIP", "active": false, "items": [{"productId": %d, "price": 4.00}]}
				""".formatted(productId);
		mvc.perform(put("/api/price-tables/" + id).contentType(MediaType.APPLICATION_JSON)
						.content(updated))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value("Atacado VIP"))
				.andExpect(jsonPath("$.active").value(false))
				.andExpect(jsonPath("$.description").doesNotExist())
				.andExpect(jsonPath("$.items[0].price").value(4.00))
				.andExpect(jsonPath("$.items.length()").value(1));

		mvc.perform(delete("/api/price-tables/" + id)).andExpect(status().isNoContent());

		mvc.perform(get("/api/price-tables/" + id)).andExpect(status().isNotFound());
	}

	@Test
	void validationErrorsReturn400() throws Exception {
		mvc.perform(post("/api/price-tables").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"\"}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/price-tables").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"Varejo\", \"items\": [{\"price\": 1.00}]}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/price-tables").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"Varejo\", \"items\": [{\"productId\": 999999, \"price\": 1.00}]}"))
				.andExpect(status().isBadRequest());

		long productId = createProduct("Croissant");
		String duplicated = """
				{"name": "Varejo", "items": [{"productId": %1$d, "price": 1.00}, {"productId": %1$d, "price": 2.00}]}
				""".formatted(productId);
		mvc.perform(post("/api/price-tables").contentType(MediaType.APPLICATION_JSON)
						.content(duplicated))
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
