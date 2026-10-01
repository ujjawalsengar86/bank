package com.bankease.dto.audit;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponseDto {
    private Long id;
    private Long userId;
    private String userEmail;
    private String action;
    private String entityType;
    private String entityId;
    private String description;
    private String ipAddress;
    private LocalDateTime createdAt;
}
