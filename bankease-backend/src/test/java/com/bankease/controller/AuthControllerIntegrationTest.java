package com.bankease.controller;

import com.bankease.dto.auth.LoginRequest;
import com.bankease.dto.auth.RegisterRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@org.springframework.transaction.annotation.Transactional
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testRegistrationAndLoginFlow() throws Exception {
        long timestamp = System.currentTimeMillis();
        String uniqueEmail = "integtest_" + timestamp + "@bankease.com";
        String uniqueMobile = "9" + String.format("%09d", timestamp % 1_000_000_000L);

        RegisterRequest registerRequest = RegisterRequest.builder()
                .fullName("Integration Tester")
                .email(uniqueEmail)
                .mobile(uniqueMobile)
                .password("TestPassword@123")
                .build();

        // 1. Register new user
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value(uniqueEmail));

        // 2. Login with registered user
        LoginRequest loginRequest = LoginRequest.builder()
                .email(uniqueEmail)
                .password("TestPassword@123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isString())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"));
    }

    @Test
    void testUnauthorizedEndpointReturns401() throws Exception {
        // Accessing protected /api/accounts without JWT token must return 401
        mockMvc.perform(get("/api/accounts"))
                .andExpect(status().isUnauthorized());
    }
}
