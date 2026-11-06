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
class ProductCategoryFlowTests {

	@Autowired
	MockMvc mvc;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void productCategoryCrud() throws Exception {
		String category = """
				{"name": "Pães", "description": "Pães e derivados de fermentação"}
				""";

		MvcResult created = mvc.perform(post("/api/product-categories").contentType(MediaType.APPLICATION_JSON)
						.content(category))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").exists())
				.andExpect(jsonPath("$.name").value("Pães"))
				.andExpect(jsonPath("$.active").value(true))
				.andReturn();
		long id = readId(created);

		mvc.perform(post("/api/product-categories").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"Pães\"}"))
				.andExpect(status().isConflict());

		mvc.perform(get("/api/product-categories"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").exists());

		mvc.perform(get("/api/product-categories").param("search", "pães"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].name").value("Pães"));

		mvc.perform(get("/api/product-categories/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.description").value("Pães e derivados de fermentação"));

		mvc.perform(put("/api/product-categories/" + id).contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"Pães Artesanais\", \"active\": false}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value("Pães Artesanais"))
				.andExpect(jsonPath("$.active").value(false))
				.andExpect(jsonPath("$.description").doesNotExist());

		mvc.perform(delete("/api/product-categories/" + id)).andExpect(status().isNoContent());

		mvc.perform(get("/api/product-categories/" + id)).andExpect(status().isNotFound());
	}

	@Test
	void validationErrorsReturn400() throws Exception {
		mvc.perform(post("/api/product-categories").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"\"}"))
				.andExpect(status().isBadRequest());
	}

	private long readId(MvcResult result) throws Exception {
		JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
		return node.get("id").asLong();
	}

}
