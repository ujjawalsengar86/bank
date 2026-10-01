package com.bankease.controller;

import com.bankease.dto.common.ApiResponse;
import com.bankease.dto.transfer.TransferRequestDto;
import com.bankease.dto.transfer.TransferResponseDto;
import com.bankease.security.SecurityUtils;
import com.bankease.service.TransferService;
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
@RequestMapping("/api/transfers")
@RequiredArgsConstructor
@Tag(name = "Fund Transfers", description = "Endpoints for initiating and reviewing fund transfers")
@SecurityRequirement(name = "BearerAuth")
public class TransferController {

    private final TransferService transferService;

    @PostMapping
    @Operation(summary = "Initiate an atomic fund transfer to a beneficiary")
    public ResponseEntity<ApiResponse<TransferResponseDto>> transferFunds(
            @Valid @RequestBody TransferRequestDto request,
            HttpServletRequest servletRequest) {
        Long userId = SecurityUtils.getCurrentUserId();
        TransferResponseDto response = transferService.initiateTransfer(userId, request, servletRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.success("Transfer completed successfully", response));
    }

    @GetMapping
    @Operation(summary = "Get transfer history for the authenticated user")
    public ResponseEntity<ApiResponse<List<TransferResponseDto>>> getMyTransfers() {
        Long userId = SecurityUtils.getCurrentUserId();
        List<TransferResponseDto> transfers = transferService.getUserTransfers(userId);
        return ResponseEntity.ok(ApiResponse.success(transfers));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get specific transfer details by transaction ID")
    public ResponseEntity<ApiResponse<TransferResponseDto>> getTransferById(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        TransferResponseDto transfer = transferService.getTransferById(id, userId);
        return ResponseEntity.ok(ApiResponse.success(transfer));
    }
}
