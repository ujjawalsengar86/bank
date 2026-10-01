package com.bankease.controller;

import com.bankease.dto.account.AccountResponseDto;
import com.bankease.dto.account.BalanceResponseDto;
import com.bankease.dto.common.ApiResponse;
import com.bankease.dto.common.PaginatedResponse;
import com.bankease.dto.transaction.TransactionResponseDto;
import com.bankease.security.SecurityUtils;
import com.bankease.service.AccountService;
import com.bankease.service.TransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
@Tag(name = "Accounts", description = "Endpoints for bank accounts, balances, and statements")
@SecurityRequirement(name = "BearerAuth")
public class AccountController {

    private final AccountService accountService;
    private final TransactionService transactionService;

    @GetMapping
    @Operation(summary = "List all accounts belonging to the authenticated user")
    public ResponseEntity<ApiResponse<List<AccountResponseDto>>> getMyAccounts() {
        Long userId = SecurityUtils.getCurrentUserId();
        List<AccountResponseDto> accounts = accountService.getUserAccounts(userId);
        return ResponseEntity.ok(ApiResponse.success(accounts));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get detailed information for a specific account")
    public ResponseEntity<ApiResponse<AccountResponseDto>> getAccountById(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        boolean isAdminOrOfficer = SecurityUtils.isAdmin() || SecurityUtils.isBankOfficer();
        AccountResponseDto account = accountService.getAccountById(id, userId, isAdminOrOfficer);
        return ResponseEntity.ok(ApiResponse.success(account));
    }

    @GetMapping("/{id}/balance")
    @Operation(summary = "Get live available balance for a specific account")
    public ResponseEntity<ApiResponse<BalanceResponseDto>> getAccountBalance(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        boolean isAdminOrOfficer = SecurityUtils.isAdmin() || SecurityUtils.isBankOfficer();
        BalanceResponseDto balance = accountService.getAccountBalance(id, userId, isAdminOrOfficer);
        return ResponseEntity.ok(ApiResponse.success(balance));
    }

    @GetMapping("/{id}/transactions")
    @Operation(summary = "Get paginated transaction statement for a specific account")
    public ResponseEntity<ApiResponse<PaginatedResponse<TransactionResponseDto>>> getAccountTransactions(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = SecurityUtils.getCurrentUserId();
        boolean isAdmin = SecurityUtils.isAdmin();
        Pageable pageable = PageRequest.of(page, size);
        PaginatedResponse<TransactionResponseDto> response = transactionService.getAccountTransactions(id, userId, pageable, isAdmin);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
