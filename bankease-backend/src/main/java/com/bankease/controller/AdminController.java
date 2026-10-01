package com.bankease.controller;

import com.bankease.dto.account.AccountResponseDto;
import com.bankease.dto.admin.AdminAccountStatusUpdateDto;
import com.bankease.dto.admin.AdminUserRoleUpdateDto;
import com.bankease.dto.admin.AdminUserStatusUpdateDto;
import com.bankease.dto.audit.AuditLogResponseDto;
import com.bankease.dto.bill.BillerResponseDto;
import com.bankease.dto.common.ApiResponse;
import com.bankease.dto.common.PaginatedResponse;
import com.bankease.dto.transaction.TransactionResponseDto;
import com.bankease.dto.user.UserProfileDto;
import com.bankease.entity.Biller;
import com.bankease.security.SecurityUtils;
import com.bankease.service.AdminService;
import com.bankease.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Operations", description = "Endpoints for administrator controls, user statuses, and audit trails")
@SecurityRequirement(name = "BearerAuth")
public class AdminController {

    private final AdminService adminService;
    private final AuditLogService auditLogService;

    @GetMapping("/users")
    @Operation(summary = "List all registered users in the system")
    public ResponseEntity<ApiResponse<List<UserProfileDto>>> getAllUsers() {
        List<UserProfileDto> users = adminService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @PutMapping("/users/{id}/status")
    @Operation(summary = "Update user account status (ACTIVE, BLOCKED) or KYC status")
    public ResponseEntity<ApiResponse<UserProfileDto>> updateUserStatus(
            @PathVariable Long id,
            @RequestBody AdminUserStatusUpdateDto dto,
            HttpServletRequest servletRequest) {
        Long adminId = SecurityUtils.getCurrentUserId();
        UserProfileDto updated = adminService.updateUserStatus(id, dto, adminId, servletRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.success("User status updated", updated));
    }

    @PutMapping("/users/{id}/role")
    @Operation(summary = "Update user authorization role (CUSTOMER, BANK_OFFICER, ADMIN)")
    public ResponseEntity<ApiResponse<UserProfileDto>> updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody AdminUserRoleUpdateDto dto,
            HttpServletRequest servletRequest) {
        Long adminId = SecurityUtils.getCurrentUserId();
        UserProfileDto updated = adminService.updateUserRole(id, dto, adminId, servletRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.success("User role updated", updated));
    }

    @GetMapping("/accounts")
    @Operation(summary = "List all bank accounts in the system")
    public ResponseEntity<ApiResponse<List<AccountResponseDto>>> getAllAccounts() {
        List<AccountResponseDto> accounts = adminService.getAllAccounts();
        return ResponseEntity.ok(ApiResponse.success(accounts));
    }

    @PutMapping("/accounts/{id}/status")
    @Operation(summary = "Update bank account status (ACTIVE, BLOCKED, CLOSED)")
    public ResponseEntity<ApiResponse<AccountResponseDto>> updateAccountStatus(
            @PathVariable Long id,
            @Valid @RequestBody AdminAccountStatusUpdateDto dto,
            HttpServletRequest servletRequest) {
        Long adminId = SecurityUtils.getCurrentUserId();
        AccountResponseDto updated = adminService.updateAccountStatus(id, dto, adminId, servletRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.success("Account status updated", updated));
    }

    @PostMapping("/billers")
    @Operation(summary = "Register a new utility biller")
    public ResponseEntity<ApiResponse<BillerResponseDto>> createBiller(
            @RequestBody Biller biller,
            HttpServletRequest servletRequest) {
        Long adminId = SecurityUtils.getCurrentUserId();
        BillerResponseDto created = adminService.createBiller(biller, adminId, servletRequest.getRemoteAddr());
        return new ResponseEntity<>(ApiResponse.success("Biller created successfully", created), HttpStatus.CREATED);
    }

    @GetMapping("/audit-logs")
    @Operation(summary = "View paginated audit trail logs across all sensitive operations")
    public ResponseEntity<ApiResponse<PaginatedResponse<AuditLogResponseDto>>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        PaginatedResponse<AuditLogResponseDto> logs = auditLogService.getAllLogs(pageable);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @GetMapping("/transactions")
    @Operation(summary = "View system-wide transaction history")
    public ResponseEntity<ApiResponse<PaginatedResponse<TransactionResponseDto>>> getAllTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        PaginatedResponse<TransactionResponseDto> txns = adminService.getAllTransactions(pageable);
        return ResponseEntity.ok(ApiResponse.success(txns));
    }
}
