package com.bankease.dto.admin;

import com.bankease.entity.Role;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserRoleUpdateDto {
    @NotNull(message = "Role is required")
    private Role role;
}
