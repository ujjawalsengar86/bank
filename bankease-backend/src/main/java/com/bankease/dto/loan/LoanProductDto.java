package com.bankease.dto.loan;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanProductDto {
    private Long id;
    private String name;
    private String loanType;
    private BigDecimal interestRate;
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    private int minTenureMonths;
    private int maxTenureMonths;
    private String description;
    private boolean active;
}
