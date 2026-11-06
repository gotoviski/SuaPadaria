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
class MeasurementUnitFlowTests {

	@Autowired
	MockMvc mvc;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void seededUnitsAreAvailable() throws Exception {
		mvc.perform(get("/api/measurement-units"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[?(@.name == 'Quilograma' && @.abbreviation == 'kg')]").isNotEmpty())
				.andExpect(jsonPath("$[?(@.name == 'Grama' && @.abbreviation == 'g')]").isNotEmpty())
				.andExpect(jsonPath("$[?(@.name == 'Litro' && @.abbreviation == 'L')]").isNotEmpty())
				.andExpect(jsonPath("$[?(@.name == 'Unidade' && @.abbreviation == 'un')]").isNotEmpty());
	}

	@Test
	void measurementUnitCrud() throws Exception {
		String unit = """
				{"name": "Mililitro", "abbreviation": "mL"}
				""";

		MvcResult created = mvc.perform(post("/api/measurement-units").contentType(MediaType.APPLICATION_JSON)
						.content(unit))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").exists())
				.andExpect(jsonPath("$.name").value("Mililitro"))
				.andExpect(jsonPath("$.abbreviation").value("mL"))
				.andExpect(jsonPath("$.active").value(true))
				.andReturn();
		long id = readId(created);

		mvc.perform(post("/api/measurement-units").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"Mililitro\", \"abbreviation\": \"ml2\"}"))
				.andExpect(status().isConflict());

		mvc.perform(post("/api/measurement-units").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"Outra\", \"abbreviation\": \"mL\"}"))
				.andExpect(status().isConflict());

		mvc.perform(get("/api/measurement-units").param("search", "mililitro"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].name").value("Mililitro"));

		mvc.perform(get("/api/measurement-units/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.abbreviation").value("mL"));

		mvc.perform(put("/api/measurement-units/" + id).contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"Mililitro\", \"abbreviation\": \"ml\", \"active\": false}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.abbreviation").value("ml"))
				.andExpect(jsonPath("$.active").value(false));

		mvc.perform(delete("/api/measurement-units/" + id)).andExpect(status().isNoContent());

		mvc.perform(get("/api/measurement-units/" + id)).andExpect(status().isNotFound());
	}

	@Test
	void validationErrorsReturn400() throws Exception {
		mvc.perform(post("/api/measurement-units").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"\", \"abbreviation\": \"x\"}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/measurement-units").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"Metro\", \"abbreviation\": \"\"}"))
				.andExpect(status().isBadRequest());
	}

	private long readId(MvcResult result) throws Exception {
		JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
		return node.get("id").asLong();
	}

}
