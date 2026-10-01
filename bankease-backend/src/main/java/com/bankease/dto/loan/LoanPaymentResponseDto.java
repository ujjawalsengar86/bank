package com.bankease.dto.loan;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanPaymentResponseDto {
    private String receiptNumber;
    private Long loanId;
    private String loanAccountNumber;
    private BigDecimal amount;
    private BigDecimal principalPortion;
    private BigDecimal interestPortion;
    private BigDecimal remainingBalance;
    private int installmentNumber;
    private LocalDateTime paymentDate;
    private String transactionReference;
}
