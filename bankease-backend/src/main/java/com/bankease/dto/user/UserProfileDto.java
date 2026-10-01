package com.bankease.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {
    private Long id;
    private String fullName;
    private String email;
    private String mobile;
    private String role;
    private String kycStatus;
    private String accountStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
