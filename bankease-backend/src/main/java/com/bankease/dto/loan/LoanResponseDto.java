package com.bankease.dto.loan;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanResponseDto {
    private Long id;
    private String loanAccountNumber;
    private Long loanProductId;
    private String loanProductName;
    private String loanType;
    private BigDecimal principalAmount;
    private BigDecimal interestRate;
    private int tenureMonths;
    private BigDecimal emiAmount;
    private BigDecimal totalPayable;
    private BigDecimal remainingBalance;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private String disbursedAccountNumber;
}
