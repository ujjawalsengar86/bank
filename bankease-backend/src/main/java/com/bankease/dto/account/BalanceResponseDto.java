package com.bankease.dto.account;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BalanceResponseDto {
    private Long accountId;
    private String accountNumber;
    private BigDecimal balance;
    private String currency;
}
