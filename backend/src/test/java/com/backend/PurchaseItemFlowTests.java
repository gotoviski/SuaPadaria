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
class PurchaseItemFlowTests {

	@Autowired
	MockMvc mvc;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void purchaseItemCrud() throws Exception {
		long supplierId = createSupplier("Moinho Norte");
		long firstProductId = createProduct("Trigo Integral");
		long productId = createProduct("Acucar Mascavo");
		long purchaseId = createPurchase(supplierId, firstProductId);

		String item = """
				{"purchaseId": %d, "productId": %d, "quantity": 25.5, "unitPrice": 4.50}
				""".formatted(purchaseId, productId);

		MvcResult created = mvc.perform(post("/api/purchase-items").contentType(MediaType.APPLICATION_JSON)
						.content(item))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").exists())
				.andExpect(jsonPath("$.purchaseId").value(purchaseId))
				.andExpect(jsonPath("$.supplierName").value("Moinho Norte"))
				.andExpect(jsonPath("$.productId").value(productId))
				.andExpect(jsonPath("$.productName").value("Acucar Mascavo"))
				.andExpect(jsonPath("$.quantity").value(25.5))
				.andExpect(jsonPath("$.unitPrice").value(4.50))
				.andExpect(jsonPath("$.totalPrice").value(114.75))
				.andReturn();
		long id = readId(created);

		mvc.perform(post("/api/purchase-items").contentType(MediaType.APPLICATION_JSON)
						.content(item))
				.andExpect(status().isConflict());

		mvc.perform(get("/api/purchase-items").param("purchaseId", String.valueOf(purchaseId)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").value(id))
				.andExpect(jsonPath("$.length()").value(2));

		mvc.perform(get("/api/purchase-items").param("productId", String.valueOf(productId)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").value(id));

		mvc.perform(get("/api/purchase-items").param("search", "mascavo"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").value(id));

		mvc.perform(get("/api/purchase-items/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalPrice").value(114.75));

		String updated = """
				{"purchaseId": %d, "productId": %d, "quantity": 10, "unitPrice": 5.00}
				""".formatted(purchaseId, productId);
		mvc.perform(put("/api/purchase-items/" + id).contentType(MediaType.APPLICATION_JSON)
						.content(updated))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.quantity").value(10))
				.andExpect(jsonPath("$.totalPrice").value(50.00));

		mvc.perform(delete("/api/purchase-items/" + id)).andExpect(status().isNoContent());

		mvc.perform(get("/api/purchase-items/" + id)).andExpect(status().isNotFound());
	}

	@Test
	void updateToExistingPairReturns409() throws Exception {
		long supplierId = createSupplier("Laticínios Sul");
		long productA = createProduct("Leite Integral");
		long productB = createProduct("Manteiga");
		long purchaseId = createPurchase(supplierId, productA);

		MvcResult second = mvc.perform(post("/api/purchase-items").contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"purchaseId": %d, "productId": %d, "quantity": 2, "unitPrice": 3.00}
								""".formatted(purchaseId, productB)))
				.andExpect(status().isCreated())
				.andReturn();
		long id = readId(second);

		mvc.perform(put("/api/purchase-items/" + id).contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"purchaseId": %d, "productId": %d, "quantity": 2, "unitPrice": 3.00}
								""".formatted(purchaseId, productA)))
				.andExpect(status().isConflict());
	}

	@Test
	void validationErrorsReturn400() throws Exception {
		mvc.perform(post("/api/purchase-items").contentType(MediaType.APPLICATION_JSON)
						.content("{\"purchaseId\": 1, \"quantity\": 1, \"unitPrice\": 1.00}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/purchase-items").contentType(MediaType.APPLICATION_JSON)
						.content("{\"productId\": 1, \"quantity\": 1, \"unitPrice\": 1.00}"))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/purchase-items").contentType(MediaType.APPLICATION_JSON)
						.content("{\"purchaseId\": 999999, \"productId\": 1, \"quantity\": 1, \"unitPrice\": 1.00}"))
				.andExpect(status().isBadRequest());

		long supplierId = createSupplier("Distribuidora Leste");
		long firstProductId = createProduct("Fermento");
		long purchaseId = createPurchase(supplierId, firstProductId);

		mvc.perform(post("/api/purchase-items").contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"purchaseId": %d, "productId": 999999, "quantity": 1, "unitPrice": 1.00}
								""".formatted(purchaseId)))
				.andExpect(status().isBadRequest());

		long productId = createProduct("Sal Refinado");
		mvc.perform(post("/api/purchase-items").contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"purchaseId": %d, "productId": %d, "quantity": 0, "unitPrice": 1.00}
								""".formatted(purchaseId, productId)))
				.andExpect(status().isBadRequest());

		mvc.perform(post("/api/purchase-items").contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"purchaseId": %d, "productId": %d, "quantity": 1, "unitPrice": -1.00}
								""".formatted(purchaseId, productId)))
				.andExpect(status().isBadRequest());
	}

	private long createSupplier(String name) throws Exception {
		MvcResult result = mvc.perform(post("/api/suppliers").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"%s\"}".formatted(name)))
				.andExpect(status().isCreated())
				.andReturn();
		return readId(result);
	}

	private long createProduct(String name) throws Exception {
		MvcResult result = mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\": \"%s\", \"price\": 5.50}".formatted(name)))
				.andExpect(status().isCreated())
				.andReturn();
		return readId(result);
	}

	private long createPurchase(long supplierId, long productId) throws Exception {
		MvcResult result = mvc.perform(post("/api/purchases").contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"supplierId": %d, "items": [{"productId": %d, "quantity": 1, "unitPrice": 1.00}]}
								""".formatted(supplierId, productId)))
				.andExpect(status().isCreated())
				.andReturn();
		return readId(result);
	}

	private long readId(MvcResult result) throws Exception {
		JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
		return node.get("id").asLong();
	}

}
