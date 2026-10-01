package com.bankease.dto.account;

import com.bankease.entity.AccountType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountCreateRequest {

    @NotNull(message = "Account type is required")
    private AccountType accountType;

    @NotNull(message = "Initial deposit amount is required")
    @PositiveOrZero(message = "Initial deposit must be zero or positive")
    private BigDecimal initialDeposit;

    private Long userId; // Optional for admin/officer creating for another user
}
