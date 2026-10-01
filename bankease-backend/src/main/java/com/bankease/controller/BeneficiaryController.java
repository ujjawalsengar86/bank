package com.bankease.controller;

import com.bankease.dto.beneficiary.BeneficiaryRequestDto;
import com.bankease.dto.beneficiary.BeneficiaryResponseDto;
import com.bankease.dto.common.ApiResponse;
import com.bankease.security.SecurityUtils;
import com.bankease.service.BeneficiaryService;
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
@RequestMapping("/api/beneficiaries")
@RequiredArgsConstructor
@Tag(name = "Beneficiaries", description = "Endpoints for managing transfer beneficiaries")
@SecurityRequirement(name = "BearerAuth")
public class BeneficiaryController {

    private final BeneficiaryService beneficiaryService;

    @GetMapping
    @Operation(summary = "List all beneficiaries saved by the authenticated user")
    public ResponseEntity<ApiResponse<List<BeneficiaryResponseDto>>> getMyBeneficiaries() {
        Long userId = SecurityUtils.getCurrentUserId();
        List<BeneficiaryResponseDto> beneficiaries = beneficiaryService.getUserBeneficiaries(userId);
        return ResponseEntity.ok(ApiResponse.success(beneficiaries));
    }

    @PostMapping
    @Operation(summary = "Add a new beneficiary for fund transfers")
    public ResponseEntity<ApiResponse<BeneficiaryResponseDto>> addBeneficiary(
            @Valid @RequestBody BeneficiaryRequestDto request,
            HttpServletRequest servletRequest) {
        Long userId = SecurityUtils.getCurrentUserId();
        BeneficiaryResponseDto response = beneficiaryService.addBeneficiary(userId, request, servletRequest.getRemoteAddr());
        return new ResponseEntity<>(
                ApiResponse.success("Beneficiary added successfully", response),
                HttpStatus.CREATED
        );
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a beneficiary by ID")
    public ResponseEntity<ApiResponse<BeneficiaryResponseDto>> getBeneficiaryById(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        BeneficiaryResponseDto beneficiary = beneficiaryService.getBeneficiaryById(id, userId);
        return ResponseEntity.ok(ApiResponse.success(beneficiary));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing beneficiary")
    public ResponseEntity<ApiResponse<BeneficiaryResponseDto>> updateBeneficiary(
            @PathVariable Long id,
            @Valid @RequestBody BeneficiaryRequestDto request,
            HttpServletRequest servletRequest) {
        Long userId = SecurityUtils.getCurrentUserId();
        BeneficiaryResponseDto response = beneficiaryService.updateBeneficiary(id, userId, request, servletRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.success("Beneficiary updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a beneficiary")
    public ResponseEntity<ApiResponse<Void>> deleteBeneficiary(
            @PathVariable Long id,
            HttpServletRequest servletRequest) {
        Long userId = SecurityUtils.getCurrentUserId();
        beneficiaryService.deleteBeneficiary(id, userId, servletRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.success("Beneficiary deleted successfully", null));
    }
}
