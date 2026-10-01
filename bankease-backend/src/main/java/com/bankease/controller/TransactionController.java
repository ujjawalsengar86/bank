package com.bankease.controller;

import com.bankease.dto.common.ApiResponse;
import com.bankease.dto.common.PaginatedResponse;
import com.bankease.dto.transaction.TransactionResponseDto;
import com.bankease.entity.TransactionStatus;
import com.bankease.entity.TransactionType;
import com.bankease.security.SecurityUtils;
import com.bankease.service.TransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@Tag(name = "Transactions", description = "Endpoints for querying and filtering transactions")
@SecurityRequirement(name = "BearerAuth")
public class TransactionController {

    private final TransactionService transactionService;

    @GetMapping
    @Operation(summary = "Get filtered and paginated transactions")
    public ResponseEntity<ApiResponse<PaginatedResponse<TransactionResponseDto>>> getTransactions(
            @RequestParam(required = false) Long accountId,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) TransactionStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Long userId = SecurityUtils.getCurrentUserId();
        boolean isAdmin = SecurityUtils.isAdmin();
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        PaginatedResponse<TransactionResponseDto> response = transactionService.getUserTransactions(
                userId, accountId, type, status, startDate, endDate, pageable, isAdmin);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a single transaction by ID")
    public ResponseEntity<ApiResponse<TransactionResponseDto>> getTransactionById(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        boolean isAdmin = SecurityUtils.isAdmin();
        TransactionResponseDto response = transactionService.getTransactionById(id, userId, isAdmin);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
