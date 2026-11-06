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
class FinancialFlowTests {

	@Autowired
	MockMvc mvc;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void financialAccountCrud() throws Exception {
		String account = """
				{"name": "Banco Principal", "type": "CHECKING", "bankName": "Banco do Brasil",
						"agency": "1234-5", "accountNumber": "98765-4", "initialBalance": 1000.00}
				""";

		MvcResult created = mvc.perform(post("/api/financial-accounts")
						.contentType(MediaType.APPLICATION_JSON).content(account))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").exists())
				.andExpect(jsonPath("$.name").value("Banco Principal"))
				.andExpect(jsonPath("$.type").value("CHECKING"))
				.andExpect(jsonPath("$.balance").value(1000.00))
				.andExpect(jsonPath("$.active").value(true))
				.andReturn();
		long id = readId(created);

		mvc.perform(get("/api/financial-accounts"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").exists());

		mvc.perform(get("/api/financial-accounts").param("search", "principal"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").value(id));

		mvc.perform(put("/api/financial-accounts/" + id).contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"Cofre\", \"type\": \"CASH\", \"active\": false}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value("Cofre"))
				.andExpect(jsonPath("$.active").value(false));

		mvc.perform(delete("/api/financial-accounts/" + id)).andExpect(status().isNoContent());
		mvc.perform(get("/api/financial-accounts/" + id)).andExpect(status().isNotFound());
	}

	@Test
	void accountPayablePayCreatesEntryAndUpdatesBalance() throws Exception {
		long accountId = createFinancialAccount(500.00);

		String payable = """
				{"description": "Aluguel", "category": "RENT", "amount": 200.00,
						"dueDate": "2026-12-10", "financialAccountId": %d}
				""".formatted(accountId);

		MvcResult created = mvc.perform(post("/api/accounts-payable")
						.contentType(MediaType.APPLICATION_JSON).content(payable))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.status").value("PENDING"))
				.andExpect(jsonPath("$.category").value("RENT"))
				.andReturn();
		long payableId = readId(created);

		mvc.perform(post("/api/accounts-payable/" + payableId + "/pay")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"paymentMethod\": \"PIX\", \"settlementDate\": \"2026-12-05\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("PAID"))
				.andExpect(jsonPath("$.paidDate").value("2026-12-05"))
				.andExpect(jsonPath("$.paymentMethod").value("PIX"));

		mvc.perform(get("/api/financial-entries").param("financialAccountId", String.valueOf(accountId)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].type").value("EXIT"))
				.andExpect(jsonPath("$[0].amount").value(200.00))
				.andExpect(jsonPath("$[0].accountPayableId").value(payableId));

		mvc.perform(get("/api/financial-accounts/" + accountId))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.balance").value(300.00));

		mvc.perform(post("/api/accounts-payable/" + payableId + "/pay")
						.contentType(MediaType.APPLICATION_JSON).content("{}"))
				.andExpect(status().isConflict());

		mvc.perform(delete("/api/accounts-payable/" + payableId)).andExpect(status().isNoContent());

		mvc.perform(get("/api/financial-entries").param("financialAccountId", String.valueOf(accountId)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(0));
	}

	@Test
	void accountReceivableReceiveCreatesEntry() throws Exception {
		long accountId = createFinancialAccount(100.00);

		String receivable = """
				{"description": "Encomenda", "amount": 80.00, "dueDate": "2026-11-20",
						"financialAccountId": %d}
				""".formatted(accountId);

		MvcResult created = mvc.perform(post("/api/accounts-receivable")
						.contentType(MediaType.APPLICATION_JSON).content(receivable))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.status").value("PENDING"))
				.andReturn();
		long receivableId = readId(created);

		mvc.perform(get("/api/accounts-receivable").param("status", "PENDING"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").exists());

		mvc.perform(post("/api/accounts-receivable/" + receivableId + "/receive")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"paymentMethod\": \"CASH\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("RECEIVED"));

		mvc.perform(get("/api/financial-accounts/" + accountId))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.balance").value(180.00));
	}

	@Test
	void financialEntryCrud() throws Exception {
		long accountId = createFinancialAccount(0);

		String entry = """
				{"financialAccountId": %d, "type": "ENTRY", "amount": 45.50,
						"description": "Aporte", "entryDate": "2026-11-06T09:00:00Z"}
				""".formatted(accountId);

		MvcResult created = mvc.perform(post("/api/financial-entries")
						.contentType(MediaType.APPLICATION_JSON).content(entry))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.type").value("ENTRY"))
				.andExpect(jsonPath("$.financialAccountName").value("Caixa Teste"))
				.andReturn();
		long id = readId(created);

		mvc.perform(put("/api/financial-entries/" + id).contentType(MediaType.APPLICATION_JSON)
						.content("{\"financialAccountId\": " + accountId
								+ ", \"type\": \"EXIT\", \"amount\": 10.00, \"description\": \"Retirada\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.type").value("EXIT"))
				.andExpect(jsonPath("$.amount").value(10.00));

		mvc.perform(delete("/api/financial-entries/" + id)).andExpect(status().isNoContent());
		mvc.perform(get("/api/financial-entries/" + id)).andExpect(status().isNotFound());
	}

	@Test
	void validationAndBusinessErrors() throws Exception {
		mvc.perform(post("/api/financial-accounts").contentType(MediaType.APPLICATION_JSON)
						.content("{}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/accounts-payable").contentType(MediaType.APPLICATION_JSON)
						.content("{\"description\": \"Sem valor\", \"dueDate\": \"2026-12-01\"}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/accounts-receivable").contentType(MediaType.APPLICATION_JSON)
						.content("{\"description\": \"Cliente inválido\", \"amount\": 10.00,"
								+ " \"dueDate\": \"2026-12-01\", \"customerId\": 999999}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/financial-entries").contentType(MediaType.APPLICATION_JSON)
						.content("{\"financialAccountId\": 999999, \"type\": \"ENTRY\", \"amount\": 10.00}"))
				.andExpect(status().isBadRequest());
	}

	@Test
	void cannotDeleteAccountWithEntries() throws Exception {
		long accountId = createFinancialAccount(0);

		mvc.perform(post("/api/financial-entries").contentType(MediaType.APPLICATION_JSON)
						.content("{\"financialAccountId\": " + accountId
								+ ", \"type\": \"ENTRY\", \"amount\": 10.00}"))
				.andExpect(status().isCreated());

		mvc.perform(delete("/api/financial-accounts/" + accountId))
				.andExpect(status().isConflict());
	}

	private long createFinancialAccount(double initialBalance) throws Exception {
		String body = """
				{"name": "Caixa Teste", "type": "CASH", "initialBalance": %.2f}
				""".formatted(initialBalance);
		MvcResult result = mvc.perform(post("/api/financial-accounts")
						.contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isCreated())
				.andReturn();
		return readId(result);
	}

	private long readId(MvcResult result) throws Exception {
		JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
		return node.get("id").asLong();
	}

}
