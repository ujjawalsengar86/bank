package com.bankease.dto.bill;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillFetchRequestDto {

    @NotNull(message = "Biller ID is required")
    private Long billerId;

    @NotBlank(message = "Consumer number is required")
    private String consumerNumber;
}
