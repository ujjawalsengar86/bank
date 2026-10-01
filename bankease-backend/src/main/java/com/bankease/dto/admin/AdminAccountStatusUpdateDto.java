package com.bankease.dto.admin;

import com.bankease.entity.AccountStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAccountStatusUpdateDto {
    @NotNull(message = "Account status is required")
    private AccountStatus status;
}
