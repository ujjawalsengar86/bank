package com.bankease.dto.investment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvestmentResponseDto {
    private Long id;
    private String investmentNumber;
    private Long investmentProductId;
    private String investmentProductName;
    private String investmentType;
    private BigDecimal investedAmount;
    private BigDecimal interestRate;
    private int tenureMonths;
    private BigDecimal expectedMaturityAmount;
    private BigDecimal currentValue;
    private String status;
    private LocalDate startDate;
    private LocalDate maturityDate;
    private String sourceAccountNumber;
    private LocalDateTime createdAt;
}
