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

import com.backend.entity.PasswordResetToken;
import com.backend.repository.PasswordResetTokenRepository;

@SpringBootTest
@AutoConfigureMockMvc
class AuthFlowTests {

	@Autowired
	MockMvc mvc;

	@Autowired
	PasswordResetTokenRepository tokenRepository;

	@Test
	void registerLoginAndCrud() throws Exception {
		String user = """
				{"name": "Ana", "email": "ana@padaria.com", "phone": "+5511999998888", "password": "senha123"}
				""";

		mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(user))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").exists())
				.andExpect(jsonPath("$.email").value("ana@padaria.com"))
				.andExpect(jsonPath("$.phone").value("+5511999998888"))
				.andExpect(jsonPath("$.password").doesNotExist());

		mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(user))
				.andExpect(status().isConflict());

		mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
						.content("{\"email\": \"ana@padaria.com\", \"password\": \"senha123\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value("Ana"));

		mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
						.content("{\"email\": \"ana@padaria.com\", \"password\": \"errada\"}"))
				.andExpect(status().isUnauthorized());

		mvc.perform(get("/api/users/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value("Ana"));

		mvc.perform(put("/api/users/1").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"Ana Maria\", \"password\": \"novaSenha1\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value("Ana Maria"));

		mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
						.content("{\"email\": \"ana@padaria.com\", \"password\": \"novaSenha1\"}"))
				.andExpect(status().isOk());

		mvc.perform(delete("/api/users/1")).andExpect(status().isNoContent());

		mvc.perform(get("/api/users/1")).andExpect(status().isNotFound());
	}

	@Test
	void passwordRecoveryBySms() throws Exception {
		mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"Beto\", \"email\": \"beto@padaria.com\", \"phone\": \"+5511988887777\", \"password\": \"senha123\"}"))
				.andExpect(status().isCreated());

		mvc.perform(post("/api/auth/forgot-password").contentType(MediaType.APPLICATION_JSON)
						.content("{\"email\": \"beto@padaria.com\"}"))
				.andExpect(status().isOk());

		String code = tokenRepository
				.findTopByUserEmailAndUsedFalseOrderByExpiresAtDesc("beto@padaria.com")
				.map(PasswordResetToken::getCode)
				.orElseThrow();

		mvc.perform(post("/api/auth/reset-password").contentType(MediaType.APPLICATION_JSON)
						.content("{\"email\": \"beto@padaria.com\", \"code\": \"000000\", \"newPassword\": \"senhaNova9\"}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/auth/reset-password").contentType(MediaType.APPLICATION_JSON)
						.content("{\"email\": \"beto@padaria.com\", \"code\": \"" + code + "\", \"newPassword\": \"senhaNova9\"}"))
				.andExpect(status().isNoContent());

		mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
						.content("{\"email\": \"beto@padaria.com\", \"password\": \"senha123\"}"))
				.andExpect(status().isUnauthorized());

		mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
						.content("{\"email\": \"beto@padaria.com\", \"password\": \"senhaNova9\"}"))
				.andExpect(status().isOk());
	}

	@Test
	void forgotPasswordWithUnknownEmailStillReturns200() throws Exception {
		mvc.perform(post("/api/auth/forgot-password").contentType(MediaType.APPLICATION_JSON)
						.content("{\"email\": \"ninguem@padaria.com\"}"))
				.andExpect(status().isOk());
	}

	@Test
	void validationErrorsReturn400() throws Exception {
		mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"\", \"email\": \"invalido\", \"phone\": \"11999998888\", \"password\": \"123\"}"))
				.andExpect(status().isBadRequest());
	}

}
