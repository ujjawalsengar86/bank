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
public class LoanApplicationResponseDto {
    private Long id;
    private Long userId;
    private String customerName;
    private Long loanProductId;
    private String loanProductName;
    private String loanType;
    private BigDecimal requestedAmount;
    private int tenureMonths;
    private BigDecimal annualIncome;
    private String purpose;
    private String status;
    private String rejectionReason;
    private BigDecimal estimatedEmi;
    private Long disbursementAccountId;
    private LocalDateTime createdAt;
}
