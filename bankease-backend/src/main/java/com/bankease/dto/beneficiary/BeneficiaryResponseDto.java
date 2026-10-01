package com.bankease.dto.beneficiary;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BeneficiaryResponseDto {
    private Long id;
    private String name;
    private String accountNumber;
    private String bankName;
    private String ifscCode;
    private String status;
    private LocalDateTime createdAt;
}
