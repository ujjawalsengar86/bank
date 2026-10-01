package com.bankease.dto.loan;

import jakarta.validation.constraints.NotBlank;
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
public class LoanApplicationRequestDto {

    @NotNull(message = "Loan product ID is required")
    private Long loanProductId;

    @NotNull(message = "Requested amount is required")
    @Positive(message = "Requested amount must be greater than zero")
    private BigDecimal requestedAmount;

    @NotNull(message = "Tenure in months is required")
    @Positive(message = "Tenure must be greater than zero")
    private Integer tenureMonths;

    @NotNull(message = "Annual income is required")
    @Positive(message = "Annual income must be greater than zero")
    private BigDecimal annualIncome;

    @NotBlank(message = "Loan purpose is required")
    private String purpose;

    @NotNull(message = "Disbursement account ID is required")
    private Long disbursementAccountId;
}
