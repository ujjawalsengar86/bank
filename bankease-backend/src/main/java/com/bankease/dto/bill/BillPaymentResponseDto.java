package com.bankease.dto.bill;

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
public class BillPaymentResponseDto {
    private String receiptNumber;
    private Long billId;
    private String billerName;
    private String consumerNumber;
    private BigDecimal amount;
    private LocalDateTime paymentDate;
    private String sourceAccountNumber;
    private String transactionReference;
    private String status;
}
