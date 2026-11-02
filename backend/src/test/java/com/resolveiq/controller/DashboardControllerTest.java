package com.resolveiq.controller;

import com.resolveiq.dto.DashboardStatsResponse;
import com.resolveiq.security.JwtAuthenticationFilter;
import com.resolveiq.security.JwtTokenProvider;
import com.resolveiq.security.SecurityConfig;
import com.resolveiq.service.IncidentService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DashboardController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private IncidentService incidentService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @Test
    @WithMockUser(username = "engineer@company.internal", roles = {"ENGINEER"})
    @DisplayName("GET /api/v1/dashboard/stats - Should return aggregated metrics")
    void testGetDashboardStats_Authenticated_Returns200OK() throws Exception {
        DashboardStatsResponse stats = new DashboardStatsResponse(
                12L, 4L, 1L, 8L, 96, 45L
        );

        when(incidentService.getDashboardStats()).thenReturn(stats);

        mockMvc.perform(get("/api/v1/dashboard/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalIncidents").value(12))
                .andExpect(jsonPath("$.activeIncidents").value(4))
                .andExpect(jsonPath("$.slaComplianceRate").value(96))
                .andExpect(jsonPath("$.averageMttrMinutes").value(45));
    }
}
