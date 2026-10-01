package com.bankease.dto.transfer;

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
public class TransferResponseDto {
    private String referenceNumber;
    private Long sourceAccountId;
    private String sourceAccountNumber;
    private String beneficiaryName;
    private String beneficiaryAccountNumber;
    private BigDecimal amount;
    private String status;
    private String description;
    private LocalDateTime timestamp;
}
