package com.bankease.dto.investment;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WithdrawRequestDto {

    @NotNull(message = "Destination account ID is required")
    private Long destinationAccountId;
}
