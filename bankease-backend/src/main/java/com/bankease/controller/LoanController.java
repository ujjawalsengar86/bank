package com.bankease.controller;

import com.bankease.dto.common.ApiResponse;
import com.bankease.dto.common.PaginatedResponse;
import com.bankease.dto.loan.*;
import com.bankease.security.SecurityUtils;
import com.bankease.service.LoanService;
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
@RequestMapping("/api/loans")
@RequiredArgsConstructor
@Tag(name = "Loans", description = "Endpoints for loan products, applications, approvals, repayment, and EMI schedules")
@SecurityRequirement(name = "BearerAuth")
public class LoanController {

    private final LoanService loanService;

    @GetMapping("/products")
    @Operation(summary = "List all active loan products (Personal, Home, Education, Vehicle)")
    public ResponseEntity<ApiResponse<List<LoanProductDto>>> getLoanProducts() {
        List<LoanProductDto> products = loanService.getLoanProducts();
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @PostMapping("/apply")
    @Operation(summary = "Apply for a new loan")
    public ResponseEntity<ApiResponse<LoanApplicationResponseDto>> applyForLoan(
            @Valid @RequestBody LoanApplicationRequestDto request,
            HttpServletRequest servletRequest) {
        Long userId = SecurityUtils.getCurrentUserId();
        LoanApplicationResponseDto response = loanService.applyLoan(userId, request, servletRequest.getRemoteAddr());
        return new ResponseEntity<>(
                ApiResponse.success("Loan application submitted successfully", response),
                HttpStatus.CREATED
        );
    }

    @GetMapping("/applications")
    @Operation(summary = "Get loan applications (customer views own; officer/admin views all)")
    public ResponseEntity<ApiResponse<?>> getApplications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = SecurityUtils.getCurrentUserId();
        if (SecurityUtils.isBankOfficer() || SecurityUtils.isAdmin()) {
            Pageable pageable = PageRequest.of(page, size);
            PaginatedResponse<LoanApplicationResponseDto> all = loanService.getAllApplications(pageable);
            return ResponseEntity.ok(ApiResponse.success(all));
        } else {
            List<LoanApplicationResponseDto> myApps = loanService.getMyApplications(userId);
            return ResponseEntity.ok(ApiResponse.success(myApps));
        }
    }

    @GetMapping("/applications/{id}")
    @Operation(summary = "Get loan application details by ID")
    public ResponseEntity<ApiResponse<LoanApplicationResponseDto>> getApplicationById(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        boolean isOfficerOrAdmin = SecurityUtils.isBankOfficer() || SecurityUtils.isAdmin();
        LoanApplicationResponseDto application = loanService.getApplicationById(id, userId, isOfficerOrAdmin);
        return ResponseEntity.ok(ApiResponse.success(application));
    }

    @PutMapping("/applications/{id}/approve")
    @PreAuthorize("hasAnyRole('BANK_OFFICER', 'ADMIN')")
    @Operation(summary = "Approve loan application and disburse funds to customer (Officer/Admin only)")
    public ResponseEntity<ApiResponse<LoanResponseDto>> approveLoan(
            @PathVariable Long id,
            HttpServletRequest servletRequest) {
        Long officerId = SecurityUtils.getCurrentUserId();
        LoanResponseDto loan = loanService.approveLoan(id, officerId, servletRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.success("Loan application approved and funds disbursed", loan));
    }

    @PutMapping("/applications/{id}/reject")
    @PreAuthorize("hasAnyRole('BANK_OFFICER', 'ADMIN')")
    @Operation(summary = "Reject loan application with reason (Officer/Admin only)")
    public ResponseEntity<ApiResponse<LoanApplicationResponseDto>> rejectLoan(
            @PathVariable Long id,
            @RequestBody(required = false) LoanApprovalRequestDto request,
            HttpServletRequest servletRequest) {
        Long officerId = SecurityUtils.getCurrentUserId();
        LoanApplicationResponseDto response = loanService.rejectLoan(id, officerId, request, servletRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.success("Loan application rejected", response));
    }

    @GetMapping("/my-loans")
    @Operation(summary = "List all active/closed loans belonging to authenticated customer")
    public ResponseEntity<ApiResponse<List<LoanResponseDto>>> getMyLoans() {
        Long userId = SecurityUtils.getCurrentUserId();
        List<LoanResponseDto> loans = loanService.getMyLoans(userId);
        return ResponseEntity.ok(ApiResponse.success(loans));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get detailed loan status and remaining balance")
    public ResponseEntity<ApiResponse<LoanResponseDto>> getLoanById(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        LoanResponseDto loan = loanService.getLoanById(id, userId);
        return ResponseEntity.ok(ApiResponse.success(loan));
    }

    @PostMapping("/{id}/pay")
    @Operation(summary = "Make an EMI or partial repayment towards active loan")
    public ResponseEntity<ApiResponse<LoanPaymentResponseDto>> payLoan(
            @PathVariable Long id,
            @Valid @RequestBody LoanPaymentRequestDto request,
            HttpServletRequest servletRequest) {
        Long userId = SecurityUtils.getCurrentUserId();
        LoanPaymentResponseDto payment = loanService.payLoan(id, userId, request, servletRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.success("Loan repayment successful", payment));
    }

    @GetMapping("/{id}/payments")
    @Operation(summary = "Get repayment history receipts for a loan")
    public ResponseEntity<ApiResponse<List<LoanPaymentResponseDto>>> getLoanPayments(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        List<LoanPaymentResponseDto> payments = loanService.getLoanPayments(id, userId);
        return ResponseEntity.ok(ApiResponse.success(payments));
    }

    @GetMapping("/{id}/schedule")
    @Operation(summary = "Get full monthly amortization schedule for a loan")
    public ResponseEntity<ApiResponse<List<RepaymentScheduleItemDto>>> getRepaymentSchedule(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        List<RepaymentScheduleItemDto> schedule = loanService.getRepaymentSchedule(id, userId);
        return ResponseEntity.ok(ApiResponse.success(schedule));
    }
}
