package com.bankease.dto.investment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvestmentProductDto {
    private Long id;
    private String name;
    private String investmentType;
    private BigDecimal interestRate;
    private BigDecimal minAmount;
    private int minTenureMonths;
    private String description;
    private boolean active;
}
