package com.bankease.dto.investment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioSummaryDto {
    private BigDecimal totalInvested;
    private BigDecimal currentValue;
    private BigDecimal totalReturns;
    private int totalInvestments;
    private Map<String, BigDecimal> breakdownByType;
}
