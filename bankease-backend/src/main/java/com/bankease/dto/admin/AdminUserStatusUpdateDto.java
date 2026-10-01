package com.bankease.dto.admin;

import com.bankease.entity.KycStatus;
import com.bankease.entity.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserStatusUpdateDto {
    private UserStatus accountStatus;
    private KycStatus kycStatus;
}
