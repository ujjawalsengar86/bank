package com.bankease.controller;

import com.bankease.dto.common.ApiResponse;
import com.bankease.dto.investment.*;
import com.bankease.security.SecurityUtils;
import com.bankease.service.InvestmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/investments")
@RequiredArgsConstructor
@Tag(name = "Investments", description = "Endpoints for investment products (FD, RD, MF), portfolio tracking, and withdrawal")
@SecurityRequirement(name = "BearerAuth")
public class InvestmentController {

    private final InvestmentService investmentService;

    @GetMapping("/products")
    @Operation(summary = "List all available investment products")
    public ResponseEntity<ApiResponse<List<InvestmentProductDto>>> getProducts() {
        List<InvestmentProductDto> products = investmentService.getInvestmentProducts();
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @PostMapping
    @Operation(summary = "Start a new investment (Fixed Deposit, Recurring Deposit, Mutual Fund)")
    public ResponseEntity<ApiResponse<InvestmentResponseDto>> createInvestment(
            @Valid @RequestBody InvestmentCreateRequestDto request,
            HttpServletRequest servletRequest) {
        Long userId = SecurityUtils.getCurrentUserId();
        InvestmentResponseDto response = investmentService.createInvestment(userId, request, servletRequest.getRemoteAddr());
        return new ResponseEntity<>(
                ApiResponse.success("Investment initiated successfully", response),
                HttpStatus.CREATED
        );
    }

    @GetMapping
    @Operation(summary = "List all investments owned by current user")
    public ResponseEntity<ApiResponse<List<InvestmentResponseDto>>> getMyInvestments() {
        Long userId = SecurityUtils.getCurrentUserId();
        List<InvestmentResponseDto> investments = investmentService.getUserInvestments(userId);
        return ResponseEntity.ok(ApiResponse.success(investments));
    }

    @GetMapping("/portfolio")
    @Operation(summary = "Get user investment portfolio summary and asset breakdown")
    public ResponseEntity<ApiResponse<PortfolioSummaryDto>> getPortfolio() {
        Long userId = SecurityUtils.getCurrentUserId();
        PortfolioSummaryDto portfolio = investmentService.getPortfolioSummary(userId);
        return ResponseEntity.ok(ApiResponse.success(portfolio));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get details of a specific investment")
    public ResponseEntity<ApiResponse<InvestmentResponseDto>> getInvestmentById(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        InvestmentResponseDto response = investmentService.getInvestmentById(id, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/withdraw")
    @Operation(summary = "Withdraw or close an active investment")
    public ResponseEntity<ApiResponse<InvestmentResponseDto>> withdrawInvestment(
            @PathVariable Long id,
            @Valid @RequestBody WithdrawRequestDto request,
            HttpServletRequest servletRequest) {
        Long userId = SecurityUtils.getCurrentUserId();
        InvestmentResponseDto response = investmentService.withdrawInvestment(id, userId, request, servletRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.success("Investment withdrawn successfully", response));
    }
}
