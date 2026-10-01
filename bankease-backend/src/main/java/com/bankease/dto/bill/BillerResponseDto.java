package com.bankease.dto.bill;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillerResponseDto {
    private Long id;
    private String name;
    private String category;
    private String billerCode;
    private String description;
    private boolean active;
}
