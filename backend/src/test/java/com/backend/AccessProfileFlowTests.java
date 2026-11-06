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
class AccessProfileFlowTests {

	@Autowired
	MockMvc mvc;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void profileCrudAndUserAssignment() throws Exception {
		MvcResult userResult = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"Carla\", \"email\": \"carla@padaria.com\", \"phone\": \"+5511977776666\", \"password\": \"senha123\"}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.profile").doesNotExist())
				.andReturn();
		long userId = readId(userResult);

		mvc.perform(get("/api/profiles")).andExpect(status().isOk());

		MvcResult profileResult = mvc.perform(post("/api/profiles").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"Administrador\", \"description\": \"Acesso total\", \"permissions\": [\"USERS_MANAGE\", \"REPORTS_VIEW\"]}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.name").value("Administrador"))
				.andExpect(jsonPath("$.permissions[0]").exists())
				.andReturn();
		long profileId = readId(profileResult);

		mvc.perform(post("/api/profiles").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"Administrador\"}"))
				.andExpect(status().isConflict());

		mvc.perform(get("/api/profiles/permissions"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0]").exists());

		mvc.perform(put("/api/users/" + userId + "/profile").contentType(MediaType.APPLICATION_JSON)
						.content("{\"profileId\": " + profileId + "}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.profile.name").value("Administrador"))
				.andExpect(jsonPath("$.profile.permissions[1]").exists());

		mvc.perform(delete("/api/profiles/" + profileId)).andExpect(status().isConflict());

		mvc.perform(put("/api/users/" + userId + "/profile").contentType(MediaType.APPLICATION_JSON)
						.content("{\"profileId\": null}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.profile").doesNotExist());

		mvc.perform(delete("/api/profiles/" + profileId)).andExpect(status().isNoContent());

		mvc.perform(get("/api/profiles/" + profileId)).andExpect(status().isNotFound());

		mvc.perform(put("/api/users/" + userId + "/profile").contentType(MediaType.APPLICATION_JSON)
						.content("{\"profileId\": " + profileId + "}"))
				.andExpect(status().isNotFound());
	}

	@Test
	void validationErrorsReturn400() throws Exception {
		mvc.perform(post("/api/profiles").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"\"}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/profiles").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"X\", \"permissions\": [\"NAO_EXISTE\"]}"))
				.andExpect(status().isBadRequest());
	}

	private long readId(MvcResult result) throws Exception {
		JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
		return node.get("id").asLong();
	}

}
