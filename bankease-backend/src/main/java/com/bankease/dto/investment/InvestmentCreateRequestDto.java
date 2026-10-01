package com.bankease.dto.investment;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvestmentCreateRequestDto {

    @NotNull(message = "Investment product ID is required")
    private Long investmentProductId;

    @NotNull(message = "Source account ID is required")
    private Long sourceAccountId;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be greater than zero")
    private BigDecimal amount;

    @NotNull(message = "Tenure in months is required")
    @Positive(message = "Tenure must be greater than zero")
    private Integer tenureMonths;
}
