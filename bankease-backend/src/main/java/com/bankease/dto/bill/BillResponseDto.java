package com.bankease.dto.bill;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillResponseDto {
    private Long id;
    private Long billerId;
    private String billerName;
    private String billerCategory;
    private String consumerNumber;
    private String consumerName;
    private BigDecimal amount;
    private LocalDate billDate;
    private LocalDate dueDate;
    private String status;
}
