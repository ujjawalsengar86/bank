package com.bankease.controller;

import com.bankease.dto.bill.*;
import com.bankease.dto.common.ApiResponse;
import com.bankease.security.SecurityUtils;
import com.bankease.service.BillService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Bill Payments", description = "Endpoints for biller discovery, bill fetching, and bill payments")
@SecurityRequirement(name = "BearerAuth")
public class BillController {

    private final BillService billService;

    @GetMapping("/billers")
    @Operation(summary = "List all active supported billers")
    public ResponseEntity<ApiResponse<List<BillerResponseDto>>> getBillers() {
        List<BillerResponseDto> billers = billService.getAllBillers();
        return ResponseEntity.ok(ApiResponse.success(billers));
    }

    @PostMapping("/bills/fetch")
    @Operation(summary = "Fetch an outstanding bill for a consumer number")
    public ResponseEntity<ApiResponse<BillResponseDto>> fetchBill(@Valid @RequestBody BillFetchRequestDto request) {
        BillResponseDto bill = billService.fetchBill(request);
        return ResponseEntity.ok(ApiResponse.success(bill));
    }

    @PostMapping("/bills/pay")
    @Operation(summary = "Pay a utility bill atomically using customer account")
    public ResponseEntity<ApiResponse<BillPaymentResponseDto>> payBill(
            @Valid @RequestBody BillPayRequestDto request,
            HttpServletRequest servletRequest) {
        Long userId = SecurityUtils.getCurrentUserId();
        BillPaymentResponseDto receipt = billService.payBill(userId, request, servletRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.success("Bill paid successfully", receipt));
    }

    @GetMapping("/bills/history")
    @Operation(summary = "Get user's past bill payment receipts")
    public ResponseEntity<ApiResponse<List<BillPaymentResponseDto>>> getBillHistory() {
        Long userId = SecurityUtils.getCurrentUserId();
        List<BillPaymentResponseDto> history = billService.getBillPaymentHistory(userId);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @GetMapping("/bills/{id}")
    @Operation(summary = "Get bill details by ID")
    public ResponseEntity<ApiResponse<BillResponseDto>> getBillById(@PathVariable Long id) {
        BillResponseDto bill = billService.getBillById(id);
        return ResponseEntity.ok(ApiResponse.success(bill));
    }
}
